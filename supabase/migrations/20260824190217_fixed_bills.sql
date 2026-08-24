-- Fixed bills live inside budgets (not a separate table): a budget can be
-- 'flexible' (today's category spending cap) or 'fixed' (a known recurring
-- bill like rent, with a description and a due day for reminders). Fixed
-- bills do not auto-generate transactions — the user still logs the real
-- payment; this is purely a cap + due-date reminder layered on the
-- existing budget row.

create type public.budget_kind as enum ('flexible', 'fixed');

alter table public.budgets
  add column kind public.budget_kind not null default 'flexible',
  add column description text,
  add column due_day smallint check (due_day between 1 and 31);

alter table public.budgets
  add constraint budgets_fixed_requires_description_and_due_day check (
    kind = 'flexible' or (description is not null and due_day is not null)
  );

-- The original schema assumed one budget per category per month. Fixed
-- bills break that: a category like "Assinaturas" can hold several fixed
-- bills (Internet, Netflix, ...) distinguished by description. Replace
-- the blanket unique constraint with two narrower ones: still at most one
-- *flexible* cap per category/month, and no exact duplicate fixed bill
-- (same category, month and description).
alter table public.budgets drop constraint budgets_user_id_category_id_period_month_key;

create unique index budgets_one_flexible_per_category_month
  on public.budgets (user_id, category_id, period_month)
  where kind = 'flexible';

create unique index budgets_no_duplicate_fixed_bill
  on public.budgets (user_id, category_id, period_month, description)
  where kind = 'fixed';

-- Raises 'bill_due' notifications for fixed budgets: one when the due day
-- is within the next 3 days, another if the day has passed with no
-- transaction logged yet in that category for the period. Dedup is done
-- by (budget_id, period_month, phase) recorded in notifications.payload,
-- same pattern as fn_check_budget_alerts.
create or replace function public.fn_check_fixed_bill_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_budget record;
  v_due_date date;
  v_days_in_month int;
  v_has_transaction boolean;
begin
  for v_budget in
    select * from public.budgets
    where kind = 'fixed' and due_day is not null
      and period_month = date_trunc('month', current_date)::date
  loop
    v_days_in_month := extract(day from (v_budget.period_month + interval '1 month' - interval '1 day'))::int;
    v_due_date := v_budget.period_month + (least(v_budget.due_day, v_days_in_month) - 1);

    if v_due_date >= current_date and v_due_date <= current_date + 3 then
      if not exists (
        select 1 from public.notifications
        where user_id = v_budget.user_id and type = 'bill_due'
          and payload ->> 'budget_id' = v_budget.id::text
          and payload ->> 'phase' = 'upcoming'
      ) then
        insert into public.notifications (user_id, type, title, body, payload, channel)
        values (
          v_budget.user_id,
          'bill_due',
          v_budget.description || ' vence em breve',
          'Vencimento em ' || to_char(v_due_date, 'DD/MM') || '.',
          jsonb_build_object('budget_id', v_budget.id, 'phase', 'upcoming', 'due_date', v_due_date),
          'in_app'
        );
      end if;
    end if;

    if v_due_date < current_date then
      select exists (
        select 1 from public.transactions
        where user_id = v_budget.user_id
          and category_id = v_budget.category_id
          and kind = 'expense'
          and transaction_date >= v_budget.period_month
          and transaction_date < (v_budget.period_month + interval '1 month')
      ) into v_has_transaction;

      if not v_has_transaction and not exists (
        select 1 from public.notifications
        where user_id = v_budget.user_id and type = 'bill_due'
          and payload ->> 'budget_id' = v_budget.id::text
          and payload ->> 'phase' = 'overdue'
      ) then
        insert into public.notifications (user_id, type, title, body, payload, channel)
        values (
          v_budget.user_id,
          'bill_due',
          v_budget.description || ' está em atraso',
          'Vencimento era em ' || to_char(v_due_date, 'DD/MM') || ' e nenhum lançamento foi encontrado na categoria.',
          jsonb_build_object('budget_id', v_budget.id, 'phase', 'overdue', 'due_date', v_due_date),
          'in_app'
        );
      end if;
    end if;
  end loop;
end;
$$;

select cron.schedule('check-fixed-bill-alerts', '30 5 * * *', $$select public.fn_check_fixed_bill_alerts();$$);
