create type public.goal_status as enum ('active', 'completed', 'archived');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount_cents bigint not null check (target_amount_cents > 0),
  current_amount_cents bigint not null default 0,
  target_date date,
  linked_account_id uuid references public.accounts (id) on delete set null,
  icon text,
  color text,
  status public.goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_id_idx on public.goals (user_id);

create trigger set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

alter table public.goals enable row level security;

create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);

-- If linked to an account, progress mirrors that account's current balance.
create or replace function public.goals_sync_linked_balance()
returns trigger
language plpgsql
as $$
begin
  update public.goals
  set current_amount_cents = greatest(new.current_balance_cents, 0)
  where linked_account_id = new.id;
  return new;
end;
$$;

create trigger accounts_sync_linked_goals
  after update of current_balance_cents on public.accounts
  for each row execute function public.goals_sync_linked_balance();
