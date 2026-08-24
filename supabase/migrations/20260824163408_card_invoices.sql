create type public.card_invoice_status as enum ('open', 'closed', 'paid', 'overdue');

create table public.card_invoices (
  id uuid primary key default gen_random_uuid(),
  credit_card_id uuid not null references public.credit_cards (id) on delete cascade,
  reference_month date not null,
  closing_date date not null,
  due_date date not null,
  total_amount_cents bigint not null default 0,
  status public.card_invoice_status not null default 'open',
  paid_at timestamptz,
  paid_amount_cents bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (credit_card_id, reference_month)
);

create index card_invoices_credit_card_id_idx on public.card_invoices (credit_card_id);

create trigger set_updated_at
  before update on public.card_invoices
  for each row execute function public.set_updated_at();

alter table public.card_invoices enable row level security;

-- card_invoices has no user_id of its own; ownership is derived through credit_cards.
create policy "card_invoices_select_own"
  on public.card_invoices for select
  using (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = card_invoices.credit_card_id and cc.user_id = auth.uid()
    )
  );

create policy "card_invoices_update_own"
  on public.card_invoices for update
  using (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = card_invoices.credit_card_id and cc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.credit_cards cc
      where cc.id = card_invoices.credit_card_id and cc.user_id = auth.uid()
    )
  );

-- Inserts/deletes happen only through triggers and scheduled functions
-- (security definer), never directly from the client.
