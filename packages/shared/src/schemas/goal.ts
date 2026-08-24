import { z } from "zod";
import { amountCentsSchema, isoDateSchema, uuidSchema } from "./common";

export const goalStatusSchema = z.enum(["active", "completed", "archived"]);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const goalSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  name: z.string().min(1).max(120),
  target_amount_cents: amountCentsSchema.positive(),
  current_amount_cents: amountCentsSchema,
  target_date: isoDateSchema.nullable(),
  linked_account_id: uuidSchema.nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  status: goalStatusSchema,
});
export type Goal = z.infer<typeof goalSchema>;

export const createGoalSchema = goalSchema
  .omit({ id: true, user_id: true, current_amount_cents: true, status: true })
  .extend({ current_amount_cents: amountCentsSchema.default(0) });
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: goalStatusSchema.optional(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
