import { z } from "zod";
import { amountCentsSchema, isoDateSchema, uuidSchema } from "./common";

export const installmentPlanSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  account_id: uuidSchema,
  payment_method_id: uuidSchema,
  credit_card_id: uuidSchema.nullable(),
  category_id: uuidSchema,
  description: z.string().min(1).max(200),
  total_amount_cents: amountCentsSchema.positive(),
  installments_count: z.number().int().min(2).max(60),
  first_due_date: isoDateSchema,
});
export type InstallmentPlan = z.infer<typeof installmentPlanSchema>;

export const createInstallmentPlanSchema = installmentPlanSchema.omit({ id: true, user_id: true });
export type CreateInstallmentPlanInput = z.infer<typeof createInstallmentPlanSchema>;
