import { z } from "zod";
import { uuidSchema } from "./common";

export const categoryKindSchema = z.enum(["income", "expense"]);
export type CategoryKind = z.infer<typeof categoryKindSchema>;

export const categorySchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema.nullable(),
  parent_category_id: uuidSchema.nullable(),
  name: z.string().min(1).max(120),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  kind: categoryKindSchema,
  is_system_default: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = categorySchema.pick({
  name: true,
  icon: true,
  color: true,
  kind: true,
  parent_category_id: true,
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
