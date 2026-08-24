-- Explicit "mark as paid" for fixed bills, decoupled from transactions
-- (a fixed bill still doesn't auto-generate a transaction; this is just a
-- per-period manual flag the user toggles from the UI).
alter table public.budgets add column paid_at timestamptz;

-- Skip both due-date alerts once the user has marked the bill as paid.
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
    where kind = 'fixed' and due_day is not null and paid_at is null
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
