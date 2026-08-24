import type { CreatePaymentMethodInput, PaymentMethod } from "@financial-control/shared";
import { supabase } from "@/lib/supabase/client";

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase.from("payment_methods").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as PaymentMethod[];
}

export async function createPaymentMethod(input: CreatePaymentMethodInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("payment_methods").insert({ ...input, user_id: userData.user.id });
  if (error) throw error;
}

export async function deactivatePaymentMethod(id: string): Promise<void> {
  const { error } = await supabase.from("payment_methods").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
