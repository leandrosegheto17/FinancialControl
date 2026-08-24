import { z } from "zod";
import { amountCentsSchema, uuidSchema } from "./common";

export const creditCardSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  name: z.string().min(1).max(120),
  brand: z.string().nullable(),
  limit_cents: amountCentsSchema,
  closing_day: z.number().int().min(1).max(31),
  due_day: z.number().int().min(1).max(31),
  payment_account_id: uuidSchema,
  color: z.string().nullable(),
  icon: z.string().nullable(),
  is_active: z.boolean(),
});
export type CreditCard = z.infer<typeof creditCardSchema>;

export const createCreditCardSchema = creditCardSchema.pick({
  name: true,
  brand: true,
  limit_cents: true,
  closing_day: true,
  due_day: true,
  payment_account_id: true,
  color: true,
  icon: true,
});
export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;

export const updateCreditCardSchema = createCreditCardSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
