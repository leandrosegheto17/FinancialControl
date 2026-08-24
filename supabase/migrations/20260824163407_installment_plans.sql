create table public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods (id),
  credit_card_id uuid references public.credit_cards (id),
  category_id uuid not null references public.categories (id),
  description text not null,
  total_amount_cents bigint not null check (total_amount_cents > 0),
  installments_count smallint not null check (installments_count between 2 and 60),
  first_due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index installment_plans_user_id_idx on public.installment_plans (user_id);

create trigger set_updated_at
  before update on public.installment_plans
  for each row execute function public.set_updated_at();

alter table public.installment_plans enable row level security;

create policy "installment_plans_select_own"
  on public.installment_plans for select
  using (auth.uid() = user_id);

create policy "installment_plans_insert_own"
  on public.installment_plans for insert
  with check (auth.uid() = user_id);

create policy "installment_plans_update_own"
  on public.installment_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "installment_plans_delete_own"
  on public.installment_plans for delete
  using (auth.uid() = user_id);
