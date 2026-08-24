import type { Category, CreateCategoryInput } from "@financial-control/shared";
import { supabase } from "@/lib/supabase/client";

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(input: CreateCategoryInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("categories")
    .insert({ ...input, user_id: userData.user.id, is_system_default: false });
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
