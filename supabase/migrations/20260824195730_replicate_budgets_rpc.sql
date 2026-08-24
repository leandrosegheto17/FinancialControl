-- Manual "replicate budget" action: copies every budget (fixed and
-- flexible) from one month into another for the calling user. paid_at is
-- never copied (a fresh period starts unpaid). SECURITY INVOKER (default)
-- so it runs as the caller — RLS on budgets applies normally to both the
-- source select and the insert, same as any client-side insert would.
-- ON CONFLICT DO NOTHING makes it safe to click twice: rows that already
-- exist in the target month (same category for flexible, same
-- category+description for fixed) are silently skipped rather than
-- erroring or duplicating.
create or replace function public.replicate_budgets(p_from_month date, p_to_month date)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.budgets (user_id, category_id, period_month, limit_cents, alert_thresholds, kind, description, due_day)
  select user_id, category_id, p_to_month, limit_cents, alert_thresholds, kind, description, due_day
  from public.budgets
  where user_id = auth.uid() and period_month = p_from_month
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.replicate_budgets(date, date) to authenticated;
