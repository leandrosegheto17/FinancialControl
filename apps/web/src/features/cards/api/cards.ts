import type { CardInvoice, CreateCreditCardInput, CreditCard } from "@financial-control/shared";
import { supabase } from "@/lib/supabase/client";

export async function listCreditCards(): Promise<CreditCard[]> {
  const { data, error } = await supabase.from("credit_cards").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data as CreditCard[];
}

export async function createCreditCard(input: CreateCreditCardInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("credit_cards").insert({ ...input, user_id: userData.user.id });
  if (error) throw error;
}

export async function deactivateCreditCard(id: string): Promise<void> {
  const { error } = await supabase.from("credit_cards").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function listInvoicesForCard(creditCardId: string): Promise<CardInvoice[]> {
  const { data, error } = await supabase
    .from("card_invoices")
    .select("*")
    .eq("credit_card_id", creditCardId)
    .order("reference_month", { ascending: false });
  if (error) throw error;
  return data as CardInvoice[];
}

export async function listInvoiceTransactions(invoiceId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, description, amount_cents, transaction_date, kind, category_id, categories(name, icon, color)")
    .eq("card_invoice_id", invoiceId)
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return data;
}
