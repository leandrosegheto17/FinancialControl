-- Trigger behavior: account balance maintenance and credit-card invoice
-- auto-assignment/recalculation on the transactions table.
-- Run via: supabase test db

create extension if not exists pgtap with schema extensions;

begin;
select plan(8);

insert into auth.users (id, email) values ('33333333-3333-3333-3333-333333333333', 'trigger-user@example.com');

insert into public.accounts (id, user_id, name, type, currency, initial_balance_cents)
values ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Conta Trigger', 'checking', 'BRL', 100000);

select is(
  (select current_balance_cents from public.accounts where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  100000::bigint,
  'new account starts with current_balance_cents = initial_balance_cents'
);

insert into public.credit_cards (id, user_id, name, limit_cents, closing_day, due_day, payment_account_id)
values ('eeeeeeee-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Cartao Trigger', 500000, 20, 27, 'aaaaaaaa-0000-0000-0000-000000000002');

insert into public.payment_methods (id, user_id, account_id, type, name)
values ('cccccccc-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000002', 'cash', 'Dinheiro Trigger');

insert into public.payment_methods (id, user_id, credit_card_id, type, name)
values ('cccccccc-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-0000-0000-0000-000000000001', 'credit_card', 'Cartao PM Trigger');

select id as category_id from public.categories where is_system_default and kind = 'expense' limit 1 \gset

-- Cash expense: balance should decrease by the amount.
insert into public.transactions (id, user_id, account_id, payment_method_id, category_id, kind, amount_cents, transaction_date)
values ('dddddddd-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', :'category_id', 'expense', 3000, current_date);

select is(
  (select current_balance_cents from public.accounts where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  97000::bigint,
  'expense transaction decreases account balance'
);

-- Cash income: balance should increase.
insert into public.transactions (id, user_id, account_id, payment_method_id, category_id, kind, amount_cents, transaction_date)
select 'dddddddd-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333',
       'aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', id, 'income', 5000, current_date
from public.categories where is_system_default and kind = 'income' limit 1;

select is(
  (select current_balance_cents from public.accounts where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  102000::bigint,
  'income transaction increases account balance'
);

-- Deleting the expense should restore the balance it removed.
delete from public.transactions where id = 'dddddddd-0000-0000-0000-000000000002';

select is(
  (select current_balance_cents from public.accounts where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  105000::bigint,
  'deleting an expense transaction restores the balance'
);

-- Credit card purchase: card_invoice_id auto-assigned, invoice created on demand.
insert into public.transactions (id, user_id, account_id, payment_method_id, category_id, kind, amount_cents, transaction_date)
values ('dddddddd-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', :'category_id', 'expense', 8000, current_date);

select isnt(
  (select card_invoice_id from public.transactions where id = 'dddddddd-0000-0000-0000-000000000004'),
  null,
  'credit card transaction gets a card_invoice_id assigned automatically'
);

select is(
  (select total_amount_cents from public.card_invoices where credit_card_id = 'eeeeeeee-0000-0000-0000-000000000001'),
  8000::bigint,
  'card invoice total reflects the single purchase'
);

-- A second purchase on the same card/period accumulates into the same invoice.
insert into public.transactions (id, user_id, account_id, payment_method_id, category_id, kind, amount_cents, transaction_date)
values ('dddddddd-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', :'category_id', 'expense', 2000, current_date);

select is(
  (select count(distinct card_invoice_id) from public.transactions where payment_method_id = 'cccccccc-0000-0000-0000-000000000003'),
  1::bigint,
  'purchases in the same period share a single invoice'
);

select is(
  (select total_amount_cents from public.card_invoices where credit_card_id = 'eeeeeeee-0000-0000-0000-000000000001'),
  10000::bigint,
  'card invoice total accumulates across purchases in the same period'
);

select * from finish();
rollback;
