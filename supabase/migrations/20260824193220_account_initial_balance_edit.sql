-- Editing initial_balance_cents after the account already has transactions
-- must shift current_balance_cents by the same delta, not overwrite it
-- (current_balance_cents = initial + sum of all transaction deltas since).
create or replace function public.accounts_adjust_balance_on_initial_change()
returns trigger
language plpgsql
as $$
begin
  if new.initial_balance_cents <> old.initial_balance_cents then
    new.current_balance_cents := old.current_balance_cents + (new.initial_balance_cents - old.initial_balance_cents);
  end if;
  return new;
end;
$$;

create trigger accounts_adjust_balance_on_initial_change
  before update of initial_balance_cents on public.accounts
  for each row execute function public.accounts_adjust_balance_on_initial_change();
