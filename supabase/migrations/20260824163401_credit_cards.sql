create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  limit_cents bigint not null default 0,
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  payment_account_id uuid not null references public.accounts (id),
  color text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index credit_cards_user_id_idx on public.credit_cards (user_id);

create trigger set_updated_at
  before update on public.credit_cards
  for each row execute function public.set_updated_at();

alter table public.credit_cards enable row level security;

create policy "credit_cards_select_own"
  on public.credit_cards for select
  using (auth.uid() = user_id);

create policy "credit_cards_insert_own"
  on public.credit_cards for insert
  with check (auth.uid() = user_id);

create policy "credit_cards_update_own"
  on public.credit_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "credit_cards_delete_own"
  on public.credit_cards for delete
  using (auth.uid() = user_id);
