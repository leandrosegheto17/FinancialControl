create type public.payment_method_type as enum ('pix', 'debit_card', 'credit_card', 'boleto', 'cash');

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete cascade,
  credit_card_id uuid references public.credit_cards (id) on delete cascade,
  type public.payment_method_type not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_methods_target_check check (
    (type = 'credit_card' and credit_card_id is not null)
    or (type <> 'credit_card' and account_id is not null)
  )
);

create index payment_methods_user_id_idx on public.payment_methods (user_id);

create trigger set_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();

alter table public.payment_methods enable row level security;

create policy "payment_methods_select_own"
  on public.payment_methods for select
  using (auth.uid() = user_id);

create policy "payment_methods_insert_own"
  on public.payment_methods for insert
  with check (auth.uid() = user_id);

create policy "payment_methods_update_own"
  on public.payment_methods for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "payment_methods_delete_own"
  on public.payment_methods for delete
  using (auth.uid() = user_id);
