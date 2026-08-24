import type { CreateGoalInput, Goal } from "@financial-control/shared";
import { supabase } from "@/lib/supabase/client";

export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data as Goal[];
}

export async function createGoal(input: CreateGoalInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("goals").insert({ ...input, user_id: userData.user.id });
  if (error) throw error;
}

export async function addToGoal(id: string, currentAmountCents: number, deltaCents: number): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ current_amount_cents: currentAmountCents + deltaCents })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}
