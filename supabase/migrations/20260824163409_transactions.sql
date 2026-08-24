create type public.transaction_kind as enum ('income', 'expense', 'transfer');
create type public.transaction_status as enum ('pending', 'cleared', 'reconciled');
create type public.transaction_source as enum ('manual', 'audio', 'ocr', 'import', 'openfinance');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id),
  payment_method_id uuid not null references public.payment_methods (id),
  category_id uuid not null references public.categories (id),
  kind public.transaction_kind not null,
  amount_cents bigint not null check (amount_cents > 0),
  description text,
  transaction_date date not null,
  status public.transaction_status not null default 'cleared',
  recurring_rule_id uuid references public.recurring_rules (id) on delete set null,
  installment_plan_id uuid references public.installment_plans (id) on delete set null,
  installment_number smallint,
  card_invoice_id uuid references public.card_invoices (id) on delete set null,
  source public.transaction_source not null default 'manual',
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, external_ref)
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_card_invoice_id_idx on public.transactions (card_invoice_id);
create index transactions_transaction_date_idx on public.transactions (transaction_date);

create trigger set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Invoice period resolution (mirrors packages/shared/src/logic/invoicePeriod.ts
-- resolveInvoicePeriod — keep both in sync when the rule changes).
-- ---------------------------------------------------------------------------
create or replace function public.resolve_invoice_period(
  p_closing_day smallint,
  p_due_day smallint,
  p_transaction_date date,
  out reference_month date,
  out closing_date date,
  out due_date date
)
language plpgsql
as $$
declare
  v_day int := extract(day from p_transaction_date)::int;
  v_month_start date := date_trunc('month', p_transaction_date)::date;
  v_days_in_month int;
  v_clamped_closing int;
  v_due_month_start date;
begin
  v_days_in_month := extract(day from ((v_month_start + interval '1 month' - interval '1 day')))::int;
  v_clamped_closing := least(p_closing_day, v_days_in_month);

  if v_day > v_clamped_closing then
    v_month_start := (v_month_start + interval '1 month')::date;
  end if;

  reference_month := v_month_start;
  v_days_in_month := extract(day from ((reference_month + interval '1 month' - interval '1 day')))::int;
  closing_date := reference_month + (least(p_closing_day, v_days_in_month) - 1);

  if p_due_day <= p_closing_day then
    v_due_month_start := (reference_month + interval '1 month')::date;
  else
    v_due_month_start := reference_month;
  end if;
  v_days_in_month := extract(day from ((v_due_month_start + interval '1 month' - interval '1 day')))::int;
  due_date := v_due_month_start + (least(p_due_day, v_days_in_month) - 1);
end;
$$;

-- Finds (or lazily creates, status='open') the invoice a credit-card
-- transaction belongs to, based on the card's closing/due day.
create or replace function public.get_or_create_card_invoice(p_credit_card_id uuid, p_transaction_date date)
returns uuid
language plpgsql
as $$
declare
  v_closing_day smallint;
  v_due_day smallint;
  v_period record;
  v_invoice_id uuid;
begin
  select closing_day, due_day into v_closing_day, v_due_day
  from public.credit_cards where id = p_credit_card_id;

  select * into v_period
  from public.resolve_invoice_period(v_closing_day, v_due_day, p_transaction_date);

  insert into public.card_invoices (credit_card_id, reference_month, closing_date, due_date)
  values (p_credit_card_id, v_period.reference_month, v_period.closing_date, v_period.due_date)
  on conflict (credit_card_id, reference_month) do nothing;

  select id into v_invoice_id from public.card_invoices
  where credit_card_id = p_credit_card_id and reference_month = v_period.reference_month;

  return v_invoice_id;
end;
$$;

-- Auto-assigns card_invoice_id whenever the payment method used is a credit card.
create or replace function public.transactions_assign_card_invoice()
returns trigger
language plpgsql
as $$
declare
  v_credit_card_id uuid;
begin
  select credit_card_id into v_credit_card_id
  from public.payment_methods
  where id = new.payment_method_id and type = 'credit_card';

  if v_credit_card_id is not null then
    new.card_invoice_id := public.get_or_create_card_invoice(v_credit_card_id, new.transaction_date);
  else
    new.card_invoice_id := null;
  end if;

  return new;
end;
$$;

create trigger transactions_assign_card_invoice
  before insert or update of payment_method_id, transaction_date on public.transactions
  for each row execute function public.transactions_assign_card_invoice();

-- Keeps accounts.current_balance_cents in sync (income/expense affect the
-- balance directly; transfer only has a single account_id in this schema
-- revision, so it is treated as an outflow from that account).
create or replace function public.transactions_apply_balance()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.accounts
    set current_balance_cents = current_balance_cents +
      case when new.kind = 'income' then new.amount_cents else -new.amount_cents end
    where id = new.account_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.accounts
    set current_balance_cents = current_balance_cents -
      case when old.kind = 'income' then old.amount_cents else -old.amount_cents end
    where id = old.account_id;
    return old;
  elsif tg_op = 'UPDATE' then
    update public.accounts
    set current_balance_cents = current_balance_cents -
      case when old.kind = 'income' then old.amount_cents else -old.amount_cents end
    where id = old.account_id;
    update public.accounts
    set current_balance_cents = current_balance_cents +
      case when new.kind = 'income' then new.amount_cents else -new.amount_cents end
    where id = new.account_id;
    return new;
  end if;
  return null;
end;
$$;

create trigger transactions_apply_balance
  after insert or delete or update of account_id, amount_cents, kind on public.transactions
  for each row execute function public.transactions_apply_balance();

-- Recalculates card_invoices.total_amount_cents from its linked transactions
-- (expense adds to the invoice, income/refund subtracts).
create or replace function public.card_invoices_recalculate_total()
returns trigger
language plpgsql
as $$
declare
  v_invoice_id uuid;
begin
  v_invoice_id := coalesce(new.card_invoice_id, old.card_invoice_id);

  if v_invoice_id is not null then
    update public.card_invoices
    set total_amount_cents = coalesce((
      select sum(case when kind = 'income' then -amount_cents else amount_cents end)
      from public.transactions
      where card_invoice_id = v_invoice_id
    ), 0)
    where id = v_invoice_id;
  end if;

  if tg_op = 'UPDATE' and old.card_invoice_id is not null and old.card_invoice_id is distinct from new.card_invoice_id then
    update public.card_invoices
    set total_amount_cents = coalesce((
      select sum(case when kind = 'income' then -amount_cents else amount_cents end)
      from public.transactions
      where card_invoice_id = old.card_invoice_id
    ), 0)
    where id = old.card_invoice_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger card_invoices_recalculate_total
  after insert or delete or update of card_invoice_id, amount_cents, kind on public.transactions
  for each row execute function public.card_invoices_recalculate_total();
