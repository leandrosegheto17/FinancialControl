import { supabase } from "@/lib/supabase/client";

export interface MonthlySummary {
  month: string;
  income_cents: number;
  expense_cents: number;
  balance_cents: number;
}

export interface CategoryBreakdownRow {
  category_id: string;
  category_name: string;
  category_color: string | null;
  amount_cents: number;
}

export async function getMonthlySummary(month: string): Promise<MonthlySummary | null> {
  const { data, error } = await supabase.from("v_monthly_summary").select("*").eq("month", month).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    month: data.month ?? month,
    income_cents: data.income_cents ?? 0,
    expense_cents: data.expense_cents ?? 0,
    balance_cents: data.balance_cents ?? 0,
  };
}

export async function getCategoryBreakdown(month: string): Promise<CategoryBreakdownRow[]> {
  const { data, error } = await supabase
    .from("v_category_breakdown")
    .select("category_id, category_name, category_color, amount_cents")
    .eq("month", month)
    .order("amount_cents", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((row): row is typeof row & { category_id: string; category_name: string; amount_cents: number } =>
      Boolean(row.category_id && row.category_name && row.amount_cents !== null)
    )
    .map((row) => ({
      category_id: row.category_id,
      category_name: row.category_name,
      category_color: row.category_color,
      amount_cents: row.amount_cents,
    }));
}

export interface AccountBalanceRow {
  id: string;
  name: string;
  current_balance_cents: number;
}

export async function getAccountBalances(): Promise<AccountBalanceRow[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, current_balance_cents")
    .eq("is_active", true)
    .order("current_balance_cents", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getConsolidatedBalance(): Promise<number> {
  const rows = await getAccountBalances();
  return rows.reduce((sum, a) => sum + a.current_balance_cents, 0);
}

function monthRange(month: string): { start: string; end: string } {
  const parts = month.split("-");
  const year = Number(parts[0]);
  const m = Number(parts[1]);
  const end = new Date(year, m, 1).toISOString().slice(0, 10);
  return { start: month, end };
}

/** Same shape as getCategoryBreakdown (which only covers expenses via the
 *  v_monthly_summary view) but for income — no equivalent view exists, so
 *  this groups client-side from a direct query. */
export async function getIncomeBreakdown(month: string): Promise<CategoryBreakdownRow[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("transactions")
    .select("amount_cents, category_id, categories(name, color)")
    .eq("kind", "income")
    .neq("status", "pending")
    .gte("transaction_date", start)
    .lt("transaction_date", end);
  if (error) throw error;

  const totals = new Map<string, CategoryBreakdownRow>();
  for (const row of data ?? []) {
    const category = row.categories as { name: string; color: string | null } | null;
    if (!category) continue;
    const existing = totals.get(row.category_id);
    if (existing) {
      existing.amount_cents += row.amount_cents;
    } else {
      totals.set(row.category_id, {
        category_id: row.category_id,
        category_name: category.name,
        category_color: category.color,
        amount_cents: row.amount_cents,
      });
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.amount_cents - a.amount_cents);
}

export interface BudgetProvision {
  fixed_cents: number;
  flexible_cents: number;
  total_cents: number;
}

/** Worst-case planned spend for the month: every fixed bill paid in full,
 *  every flexible budget spent up to its 100% limit. */
export async function getBudgetProvision(month: string): Promise<BudgetProvision> {
  const { data, error } = await supabase.from("budgets").select("kind, limit_cents").eq("period_month", month);
  if (error) throw error;

  const fixed_cents = (data ?? []).filter((b) => b.kind === "fixed").reduce((sum, b) => sum + b.limit_cents, 0);
  const flexible_cents = (data ?? []).filter((b) => b.kind === "flexible").reduce((sum, b) => sum + b.limit_cents, 0);

  return { fixed_cents, flexible_cents, total_cents: fixed_cents + flexible_cents };
}
