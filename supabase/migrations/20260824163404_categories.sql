create type public.category_kind as enum ('income', 'expense');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  parent_category_id uuid references public.categories (id) on delete cascade,
  name text not null,
  icon text,
  color text,
  kind public.category_kind not null,
  is_system_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_user_id_idx on public.categories (user_id);
create index categories_parent_category_id_idx on public.categories (parent_category_id);

create trigger set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

-- Every authenticated user can read their own categories plus the system defaults.
create policy "categories_select_own_or_default"
  on public.categories for select
  using (user_id = auth.uid() or user_id is null);

-- System-default categories (user_id is null) are read-only for everyone;
-- users may only create/edit/delete their own non-default categories.
create policy "categories_insert_own"
  on public.categories for insert
  with check (user_id = auth.uid() and is_system_default = false);

create policy "categories_update_own"
  on public.categories for update
  using (user_id = auth.uid() and is_system_default = false)
  with check (user_id = auth.uid() and is_system_default = false);

create policy "categories_delete_own"
  on public.categories for delete
  using (user_id = auth.uid() and is_system_default = false);
