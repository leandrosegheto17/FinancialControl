import { z } from "zod";
import { amountCentsSchema, currencySchema, uuidSchema } from "./common";

export const accountTypeSchema = z.enum(["checking", "savings", "wallet", "investment"]);
export type AccountType = z.infer<typeof accountTypeSchema>;

export const accountSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  name: z.string().min(1).max(120),
  type: accountTypeSchema,
  currency: currencySchema,
  initial_balance_cents: amountCentsSchema,
  current_balance_cents: amountCentsSchema,
  color: z.string().nullable(),
  icon: z.string().nullable(),
  is_active: z.boolean(),
});
export type Account = z.infer<typeof accountSchema>;

export const createAccountSchema = accountSchema.pick({
  name: true,
  type: true,
  currency: true,
  initial_balance_cents: true,
  color: true,
  icon: true,
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
