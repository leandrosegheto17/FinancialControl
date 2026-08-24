-- RLS isolation: user A must never see, edit, or delete user B's rows.
-- Run via: supabase test db

create extension if not exists pgtap with schema extensions;

begin;
select plan(9);

-- Fixtures: two users, one account each, one transaction each.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'rls-user-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'rls-user-b@example.com');

insert into public.accounts (id, user_id, name, type, currency, initial_balance_cents)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Conta A', 'checking', 'BRL', 10000),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Conta B', 'checking', 'BRL', 20000);

select id as category_id from public.categories where is_system_default and kind = 'expense' limit 1 \gset

insert into public.payment_methods (id, user_id, account_id, type, name)
values ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'cash', 'Dinheiro A');

insert into public.transactions (id, user_id, account_id, payment_method_id, category_id, kind, amount_cents, transaction_date)
values ('dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', :'category_id', 'expense', 500, current_date);

-- Act as user A.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
  (select count(*) from public.accounts),
  1::bigint,
  'user A only sees their own account'
);

select is(
  (select count(*) from public.accounts where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0::bigint,
  'user A cannot select user B''s account by id'
);

with updated as (
  update public.accounts set name = 'hacked' where id = 'bbbbbbbb-0000-0000-0000-000000000001' returning 1
)
select count(*) as affected from updated \gset update_

select is(:update_affected::bigint, 0::bigint, 'user A''s UPDATE against user B''s account affects zero rows');

with deleted as (
  delete from public.accounts where id = 'bbbbbbbb-0000-0000-0000-000000000001' returning 1
)
select count(*) as affected from deleted \gset delete_

select is(:delete_affected::bigint, 0::bigint, 'user A''s DELETE against user B''s account affects zero rows');

select throws_ok(
  $$ insert into public.accounts (user_id, name, type, currency) values ('22222222-2222-2222-2222-222222222222', 'x', 'checking', 'BRL') $$,
  'new row violates row-level security policy for table "accounts"',
  'user A cannot INSERT an account owned by user B'
);

select is(
  (select count(*) from public.transactions),
  1::bigint,
  'user A only sees their own transaction'
);

-- Switch to user B: symmetric checks.
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.accounts),
  1::bigint,
  'user B only sees their own account'
);

select is(
  (select name from public.accounts limit 1),
  'Conta B',
  'user B sees exactly their own account, unaffected by user A''s attempted writes'
);

select is(
  (select count(*) from public.transactions where id = 'dddddddd-0000-0000-0000-000000000001'),
  0::bigint,
  'user B cannot select user A''s transaction'
);

select * from finish();
rollback;
