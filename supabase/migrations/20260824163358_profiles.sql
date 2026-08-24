create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  base_currency char(3) not null default 'BRL',
  locale text not null default 'pt-BR',
  pin_hash text,
  pin_failed_attempts smallint not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Creates a profile row automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- PIN fallback: hash+salt via pgcrypto, RPC enforces attempt counting/lockout.
create or replace function public.set_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_pin !~ '^[0-9]{4,8}$' then
    raise exception 'PIN must be 4 to 8 digits';
  end if;

  update public.profiles
  set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')),
      pin_failed_attempts = 0,
      pin_locked_until = null
  where id = auth.uid();
end;
$$;

create or replace function public.verify_pin(p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile public.profiles;
  v_ok boolean;
begin
  select * into v_profile from public.profiles where id = auth.uid();

  if v_profile.pin_hash is null then
    raise exception 'No PIN configured';
  end if;

  if v_profile.pin_locked_until is not null and v_profile.pin_locked_until > now() then
    raise exception 'PIN locked, try again later';
  end if;

  v_ok := v_profile.pin_hash = extensions.crypt(p_pin, v_profile.pin_hash);

  if v_ok then
    update public.profiles
    set pin_failed_attempts = 0, pin_locked_until = null
    where id = auth.uid();
  else
    update public.profiles
    set pin_failed_attempts = pin_failed_attempts + 1,
        pin_locked_until = case
          when pin_failed_attempts + 1 >= 5 then now() + interval '15 minutes'
          else pin_locked_until
        end
    where id = auth.uid();
  end if;

  return v_ok;
end;
$$;
