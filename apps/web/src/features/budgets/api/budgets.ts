import type { Budget, CreateBudgetInput, UpdateBudgetInput } from "@financial-control/shared";
import { supabase } from "@/lib/supabase/client";

export interface BudgetWithSpend extends Budget {
  categories: { name: string; icon: string | null; color: string | null } | null;
}

export async function listBudgetsForMonth(periodMonth: string): Promise<BudgetWithSpend[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*, categories(name, icon, color)")
    .eq("period_month", periodMonth)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as BudgetWithSpend[];
}

export async function getCategorySpend(categoryId: string, periodMonth: string): Promise<number> {
  const monthStart = periodMonth;
  const monthEnd = new Date(new Date(periodMonth).getFullYear(), new Date(periodMonth).getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount_cents")
    .eq("category_id", categoryId)
    .eq("kind", "expense")
    .neq("status", "pending")
    .gte("transaction_date", monthStart)
    .lt("transaction_date", monthEnd);
  if (error) throw error;
  return (data ?? []).reduce((sum, t) => sum + t.amount_cents, 0);
}

export async function createBudget(input: CreateBudgetInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("budgets").insert({ ...input, user_id: userData.user.id });
  if (error) throw error;
}

export async function updateBudget(id: string, input: UpdateBudgetInput): Promise<void> {
  const { error } = await supabase.from("budgets").update(input).eq("id", id);
  if (error) throw error;
}

export async function setBudgetPaid(id: string, paid: boolean): Promise<void> {
  const { error } = await supabase
    .from("budgets")
    .update({ paid_at: paid ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

/** Copies every budget from `fromMonth` into `toMonth`; rows that would
 *  collide with an existing budget in `toMonth` are skipped. Returns how
 *  many were actually inserted. */
export async function replicateBudgets(fromMonth: string, toMonth: string): Promise<number> {
  const { data, error } = await supabase.rpc("replicate_budgets", { p_from_month: fromMonth, p_to_month: toMonth });
  if (error) throw error;
  return data ?? 0;
}
