-- security_invoker makes these views run with the querying role's own RLS
-- policies applied to the underlying tables, so a view never leaks another
-- user's rows even without policies of its own.

create view public.v_monthly_summary
with (security_invoker = true) as
select
  user_id,
  date_trunc('month', transaction_date)::date as month,
  coalesce(sum(amount_cents) filter (where kind = 'income'), 0) as income_cents,
  coalesce(sum(amount_cents) filter (where kind = 'expense'), 0) as expense_cents,
  coalesce(sum(amount_cents) filter (where kind = 'income'), 0)
    - coalesce(sum(amount_cents) filter (where kind = 'expense'), 0) as balance_cents
from public.transactions
where status <> 'pending'
group by user_id, date_trunc('month', transaction_date);

comment on view public.v_monthly_summary is
  'Per-user, per-month income/expense/balance. Excludes pending (future recurring) transactions.';

create view public.v_category_breakdown
with (security_invoker = true) as
select
  t.user_id,
  date_trunc('month', t.transaction_date)::date as month,
  t.category_id,
  c.name as category_name,
  c.color as category_color,
  c.icon as category_icon,
  sum(t.amount_cents) as amount_cents
from public.transactions t
join public.categories c on c.id = t.category_id
where t.kind = 'expense' and t.status <> 'pending'
group by t.user_id, date_trunc('month', t.transaction_date), t.category_id, c.name, c.color, c.icon;

comment on view public.v_category_breakdown is
  'Per-user, per-month expense total by category, for the dashboard breakdown chart.';

grant select on public.v_monthly_summary to authenticated;
grant select on public.v_category_breakdown to authenticated;
