-- PIN fallback lives on public.profiles (see 20260824163358_profiles.sql:
-- pin_hash/pin_failed_attempts/pin_locked_until + set_pin/verify_pin RPCs).
-- This migration only adds WebAuthn credential storage.

create table public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,
  public_key bytea not null,
  sign_count bigint not null default 0,
  device_label text,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index webauthn_credentials_user_id_idx on public.webauthn_credentials (user_id);

alter table public.webauthn_credentials enable row level security;

create policy "webauthn_credentials_select_own"
  on public.webauthn_credentials for select
  using (auth.uid() = user_id);

create policy "webauthn_credentials_delete_own"
  on public.webauthn_credentials for delete
  using (auth.uid() = user_id);

-- Inserts/updates (registration + sign_count bump) happen only through the
-- webauthn-register / webauthn-authenticate Edge Functions using the
-- service role key, never directly from the client.

-- Short-lived scratch space for the challenge issued in the "options" step
-- of a WebAuthn ceremony, consumed by the "verify" step. One row per user;
-- rows older than a couple of minutes are treated as expired by the
-- functions themselves. No RLS: only ever touched by Edge Functions with
-- the service role key.
create table public.webauthn_challenges (
  user_id uuid primary key references auth.users (id) on delete cascade,
  challenge text not null,
  created_at timestamptz not null default now()
);

alter table public.webauthn_challenges enable row level security;
-- No policies: service_role bypasses RLS; no other role should ever touch this table.
