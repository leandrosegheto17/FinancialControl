create type public.account_type as enum ('checking', 'savings', 'wallet', 'investment');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type public.account_type not null,
  currency char(3) not null default 'BRL',
  initial_balance_cents bigint not null default 0,
  current_balance_cents bigint not null default 0,
  color text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

create trigger set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts_select_own"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "accounts_insert_own"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "accounts_update_own"
  on public.accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "accounts_delete_own"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- New accounts start with current_balance_cents mirroring the initial balance.
create or replace function public.accounts_set_initial_balance()
returns trigger
language plpgsql
as $$
begin
  new.current_balance_cents := new.initial_balance_cents;
  return new;
end;
$$;

create trigger accounts_set_initial_balance
  before insert on public.accounts
  for each row execute function public.accounts_set_initial_balance();
