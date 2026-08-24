import { z } from "zod";
import { uuidSchema } from "./common";

export const paymentMethodTypeSchema = z.enum(["pix", "debit_card", "credit_card", "boleto", "cash"]);
export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>;

export const paymentMethodSchema = z
  .object({
    id: uuidSchema,
    user_id: uuidSchema,
    account_id: uuidSchema.nullable(),
    credit_card_id: uuidSchema.nullable(),
    type: paymentMethodTypeSchema,
    name: z.string().min(1).max(120),
    is_active: z.boolean(),
  })
  .refine(
    (v) =>
      v.type === "credit_card"
        ? v.credit_card_id !== null
        : v.account_id !== null,
    { message: "credit_card requires credit_card_id; other types require account_id" }
  );
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const createPaymentMethodSchema = z
  .object({
    type: paymentMethodTypeSchema,
    name: z.string().min(1).max(120),
    account_id: uuidSchema.nullable().optional(),
    credit_card_id: uuidSchema.nullable().optional(),
  })
  .refine(
    (v) =>
      v.type === "credit_card"
        ? !!v.credit_card_id
        : !!v.account_id,
    { message: "credit_card requires credit_card_id; other types require account_id" }
  );
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
