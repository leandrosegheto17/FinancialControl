create type public.notification_type as enum ('budget_alert', 'bill_due', 'goal_progress', 'invoice_closed', 'system');
create type public.notification_channel as enum ('push', 'email', 'in_app');
create type public.notification_status as enum ('pending', 'sent', 'failed', 'read');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  channel public.notification_channel not null default 'in_app',
  status public.notification_status not null default 'pending',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_status_idx on public.notifications (status);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users may only mark their own notifications as read, not rewrite content.
create policy "notifications_update_own_read_state"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts happen only through security-definer scheduled functions
-- (e.g. fn_check_budget_alerts), never directly from the client.
