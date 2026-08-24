create type public.recurrence_kind as enum ('income', 'expense');
create type public.recurrence_frequency as enum ('daily', 'weekly', 'monthly', 'yearly');
create type public.recurrence_end_type as enum ('date', 'occurrences', 'infinite');

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods (id),
  category_id uuid not null references public.categories (id),
  description text not null,
  amount_cents bigint not null check (amount_cents > 0),
  kind public.recurrence_kind not null,
  frequency public.recurrence_frequency not null,
  "interval" smallint not null default 1 check ("interval" > 0),
  start_date date not null,
  end_type public.recurrence_end_type not null,
  end_date date,
  occurrences_total int,
  occurrences_generated int not null default 0,
  next_run_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_rules_end_date_check check (end_type <> 'date' or end_date is not null),
  constraint recurring_rules_occurrences_check check (end_type <> 'occurrences' or occurrences_total is not null)
);

create index recurring_rules_user_id_idx on public.recurring_rules (user_id);
create index recurring_rules_next_run_date_idx on public.recurring_rules (next_run_date) where is_active;

create trigger set_updated_at
  before update on public.recurring_rules
  for each row execute function public.set_updated_at();

alter table public.recurring_rules enable row level security;

create policy "recurring_rules_select_own"
  on public.recurring_rules for select
  using (auth.uid() = user_id);

create policy "recurring_rules_insert_own"
  on public.recurring_rules for insert
  with check (auth.uid() = user_id);

create policy "recurring_rules_update_own"
  on public.recurring_rules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recurring_rules_delete_own"
  on public.recurring_rules for delete
  using (auth.uid() = user_id);

-- Defaults next_run_date to start_date so callers don't have to compute it.
create or replace function public.recurring_rules_default_next_run_date()
returns trigger
language plpgsql
as $$
begin
  if new.next_run_date is null then
    new.next_run_date := new.start_date;
  end if;
  return new;
end;
$$;

create trigger recurring_rules_default_next_run_date
  before insert on public.recurring_rules
  for each row execute function public.recurring_rules_default_next_run_date();
