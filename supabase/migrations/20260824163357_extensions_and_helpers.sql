-- Extensions used across the schema.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pgsodium;
create extension if not exists pg_cron;

-- Generic trigger function: keeps `updated_at` current on every UPDATE.
-- Reused by every table below that has an `updated_at timestamptz` column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
