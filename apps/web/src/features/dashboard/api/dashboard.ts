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

export async function getConsolidatedBalance(): Promise<number> {
  const { data, error } = await supabase.from("accounts").select("current_balance_cents").eq("is_active", true);
  if (error) throw error;
  return (data ?? []).reduce((sum, a) => sum + a.current_balance_cents, 0);
}
