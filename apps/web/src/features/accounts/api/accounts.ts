import type { Account, CreateAccountInput, UpdateAccountInput } from "@financial-control/shared";
import { supabase } from "@/lib/supabase/client";

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data as Account[];
}

export async function createAccount(input: CreateAccountInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("accounts").insert({ ...input, user_id: userData.user.id });
  if (error) throw error;
}

export async function updateAccount(id: string, input: UpdateAccountInput): Promise<void> {
  const { error } = await supabase.from("accounts").update(input).eq("id", id);
  if (error) throw error;
}

export async function deactivateAccount(id: string): Promise<void> {
  const { error } = await supabase.from("accounts").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
