-- ---------------------------------------------------------------------------
-- Deviation from SSD.md §1/§3: recurring-generator, invoice-closer and
-- budget-alert-checker are implemented here as plain Postgres functions
-- scheduled directly by pg_cron, instead of Edge Functions invoked over
-- HTTP via pg_net. All three are pure deterministic logic over data already
-- in Postgres (no external provider calls), so the extra HTTP hop added no
-- value and made local testing (`supabase db reset`) depend on
-- `supabase functions serve` being up. Same outcome, simpler local dev.
-- ---------------------------------------------------------------------------

-- Mirrors packages/shared/src/logic/recurrence.ts calcNextRecurrenceDate —
-- keep both in sync when the rule changes.
create or replace function public.calc_next_recurrence_date(
  p_frequency public.recurrence_frequency,
  p_interval smallint,
  p_start_date date,
  p_end_type public.recurrence_end_type,
  p_end_date date,
  p_occurrences_total int,
  p_occurrences_generated int,
  p_from_date date
)
returns date
language plpgsql
as $$
declare
  v_anchor_day int := extract(day from p_start_date)::int;
  v_next date;
  v_days_in_month int;
begin
  if p_end_type = 'occurrences' and p_occurrences_generated >= coalesce(p_occurrences_total, 0) then
    return null;
  end if;

  if p_frequency = 'daily' then
    v_next := p_from_date + (p_interval || ' days')::interval;
  elsif p_frequency = 'weekly' then
    v_next := p_from_date + ((p_interval * 7) || ' days')::interval;
  elsif p_frequency = 'monthly' then
    v_next := date_trunc('month', p_from_date) + ((p_interval || ' months')::interval);
    v_days_in_month := extract(day from (v_next + interval '1 month' - interval '1 day'))::int;
    v_next := v_next + (least(v_anchor_day, v_days_in_month) - 1);
  elsif p_frequency = 'yearly' then
    v_next := date_trunc('month', p_from_date) + (((p_interval * 12) || ' months')::interval);
    v_days_in_month := extract(day from (v_next + interval '1 month' - interval '1 day'))::int;
    v_next := v_next + (least(v_anchor_day, v_days_in_month) - 1);
  end if;

  if p_end_type = 'date' and p_end_date is not null and v_next::date > p_end_date then
    return null;
  end if;

  return v_next::date;
end;
$$;

-- Materializes recurring_rules into a 60-day sliding window as 'pending'
-- transactions, advancing next_run_date and deactivating exhausted rules.
create or replace function public.fn_generate_recurring_transactions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_end date := current_date + 60;
  v_rule record;
  v_cursor date;
  v_next date;
  v_generated_count int;
  v_still_active boolean;
begin
  for v_rule in
    select * from public.recurring_rules
    where is_active and next_run_date <= v_window_end
    for update
  loop
    v_cursor := v_rule.next_run_date;
    v_generated_count := v_rule.occurrences_generated;
    v_still_active := true;

    while v_cursor is not null and v_cursor <= v_window_end loop
      insert into public.transactions (
        user_id, account_id, payment_method_id, category_id, kind,
        amount_cents, description, transaction_date, status,
        recurring_rule_id, source
      ) values (
        v_rule.user_id, v_rule.account_id, v_rule.payment_method_id, v_rule.category_id,
        v_rule.kind::text::public.transaction_kind, v_rule.amount_cents, v_rule.description,
        v_cursor, 'pending', v_rule.id, 'manual'
      );

      v_generated_count := v_generated_count + 1;

      v_next := public.calc_next_recurrence_date(
        v_rule.frequency, v_rule.interval, v_rule.start_date, v_rule.end_type,
        v_rule.end_date, v_rule.occurrences_total, v_generated_count, v_cursor
      );

      if v_next is null then
        v_still_active := false;
        exit;
      end if;

      v_cursor := v_next;
    end loop;

    update public.recurring_rules
    set occurrences_generated = v_generated_count,
        next_run_date = case when v_still_active then v_cursor else next_run_date end,
        is_active = v_still_active
    where id = v_rule.id;
  end loop;
end;
$$;

-- Closes invoices past their closing_date and flags unpaid ones past due_date.
create or replace function public.fn_close_due_invoices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.card_invoices
  set status = 'closed'
  where status = 'open' and closing_date <= current_date;

  update public.card_invoices
  set status = 'overdue'
  where status = 'closed' and due_date < current_date;
end;
$$;

-- For every budget, sums this period's expenses in that category and
-- raises an in-app notification the first time each configured threshold
-- (e.g. 80%, 100%) is crossed. Dedup is done by (budget_id, threshold)
-- recorded in notifications.payload, so re-running is a no-op.
create or replace function public.fn_check_budget_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_budget record;
  v_spent bigint;
  v_threshold smallint;
  v_pct numeric;
  v_month_start date;
  v_month_end date;
begin
  for v_budget in select * from public.budgets loop
    v_month_start := date_trunc('month', v_budget.period_month)::date;
    v_month_end := (v_month_start + interval '1 month')::date;

    select coalesce(sum(amount_cents), 0) into v_spent
    from public.transactions
    where user_id = v_budget.user_id
      and category_id = v_budget.category_id
      and kind = 'expense'
      and transaction_date >= v_month_start
      and transaction_date < v_month_end;

    v_pct := case when v_budget.limit_cents > 0
      then (v_spent::numeric / v_budget.limit_cents::numeric) * 100
      else 0
    end;

    foreach v_threshold in array v_budget.alert_thresholds loop
      if v_pct >= v_threshold and not exists (
        select 1 from public.notifications
        where user_id = v_budget.user_id
          and type = 'budget_alert'
          and payload ->> 'budget_id' = v_budget.id::text
          and (payload ->> 'threshold')::int = v_threshold
      ) then
        insert into public.notifications (user_id, type, title, body, payload, channel)
        values (
          v_budget.user_id,
          'budget_alert',
          'Orçamento atingiu ' || v_threshold || '%',
          'O orçamento desta categoria atingiu ' || round(v_pct) || '% do limite definido para o período.',
          jsonb_build_object(
            'budget_id', v_budget.id,
            'threshold', v_threshold,
            'spent_cents', v_spent,
            'limit_cents', v_budget.limit_cents
          ),
          'in_app'
        );
      end if;
    end loop;
  end loop;
end;
$$;

select cron.schedule('generate-recurring-transactions', '0 3 * * *', $$select public.fn_generate_recurring_transactions();$$);
select cron.schedule('close-due-invoices', '0 4 * * *', $$select public.fn_close_due_invoices();$$);
select cron.schedule('check-budget-alerts', '0 5 * * *', $$select public.fn_check_budget_alerts();$$);
