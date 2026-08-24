import type { CreateInstallmentPlanInput, CreateRecurringRuleInput, CreateTransactionInput } from "@financial-control/shared";
import { supabase } from "@/lib/supabase/client";

export interface TransactionRow {
  id: string;
  description: string | null;
  amount_cents: number;
  transaction_date: string;
  kind: "income" | "expense" | "transfer";
  status: "pending" | "cleared" | "reconciled";
  account_id: string;
  category_id: string;
  installment_number: number | null;
  accounts: { name: string } | null;
  categories: { name: string; icon: string | null; color: string | null } | null;
}

export async function listTransactions(): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, description, amount_cents, transaction_date, kind, status, account_id, category_id, installment_number, accounts(name), categories(name, icon, color)"
    )
    .order("transaction_date", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as unknown as TransactionRow[];
}

export async function createTransaction(input: CreateTransactionInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("transactions").insert({ ...input, user_id: userData.user.id, source: "manual" });
  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

export async function createRecurringRule(input: CreateRecurringRuleInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("recurring_rules")
    .insert({ ...input, user_id: userData.user.id, next_run_date: input.start_date });
  if (error) throw error;
}

export async function createInstallmentPlanWithTransactions(input: CreateInstallmentPlanInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: plan, error: planError } = await supabase
    .from("installment_plans")
    .insert({ ...input, user_id: userData.user.id })
    .select("id")
    .single();
  if (planError) throw planError;

  const perInstallmentCents = Math.round(input.total_amount_cents / input.installments_count);
  const rows = Array.from({ length: input.installments_count }, (_, i) => {
    const dueDate = new Date(input.first_due_date);
    dueDate.setMonth(dueDate.getMonth() + i);
    const isLast = i === input.installments_count - 1;
    const amount = isLast
      ? input.total_amount_cents - perInstallmentCents * (input.installments_count - 1)
      : perInstallmentCents;

    return {
      user_id: userData.user!.id,
      account_id: input.account_id,
      payment_method_id: input.payment_method_id,
      category_id: input.category_id,
      kind: "expense" as const,
      amount_cents: amount,
      description: `${input.description} (${i + 1}/${input.installments_count})`,
      transaction_date: dueDate.toISOString().slice(0, 10),
      status: "pending" as const,
      installment_plan_id: plan.id,
      installment_number: i + 1,
      source: "manual" as const,
    };
  });

  const { error: txError } = await supabase.from("transactions").insert(rows);
  if (txError) throw txError;
}
