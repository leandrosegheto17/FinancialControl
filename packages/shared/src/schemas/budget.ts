import { z } from "zod";
import { amountCentsSchema, isoDateSchema, uuidSchema } from "./common";

export const budgetSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  category_id: uuidSchema,
  period_month: isoDateSchema,
  limit_cents: amountCentsSchema.positive(),
  alert_thresholds: z.array(z.number().int().min(1).max(200)).default([80, 100]),
});
export type Budget = z.infer<typeof budgetSchema>;

export const createBudgetSchema = budgetSchema.omit({ id: true, user_id: true });
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = createBudgetSchema.partial();
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
