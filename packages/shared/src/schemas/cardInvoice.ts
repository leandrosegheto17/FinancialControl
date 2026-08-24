import { z } from "zod";
import { amountCentsSchema, isoDateSchema, uuidSchema } from "./common";

export const cardInvoiceStatusSchema = z.enum(["open", "closed", "paid", "overdue"]);
export type CardInvoiceStatus = z.infer<typeof cardInvoiceStatusSchema>;

export const cardInvoiceSchema = z.object({
  id: uuidSchema,
  credit_card_id: uuidSchema,
  reference_month: isoDateSchema,
  closing_date: isoDateSchema,
  due_date: isoDateSchema,
  total_amount_cents: amountCentsSchema,
  status: cardInvoiceStatusSchema,
  paid_at: z.string().nullable(),
  paid_amount_cents: amountCentsSchema.nullable(),
});
export type CardInvoice = z.infer<typeof cardInvoiceSchema>;
