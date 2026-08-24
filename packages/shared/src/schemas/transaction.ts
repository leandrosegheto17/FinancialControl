import { z } from "zod";
import { amountCentsSchema, isoDateSchema, uuidSchema } from "./common";

export const transactionKindSchema = z.enum(["income", "expense", "transfer"]);
export type TransactionKind = z.infer<typeof transactionKindSchema>;

export const transactionStatusSchema = z.enum(["pending", "cleared", "reconciled"]);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export const transactionSourceSchema = z.enum(["manual", "audio", "ocr", "import", "openfinance"]);
export type TransactionSource = z.infer<typeof transactionSourceSchema>;

export const transactionSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  account_id: uuidSchema,
  payment_method_id: uuidSchema,
  category_id: uuidSchema,
  kind: transactionKindSchema,
  amount_cents: amountCentsSchema.positive(),
  description: z.string().max(200).nullable(),
  transaction_date: isoDateSchema,
  status: transactionStatusSchema,
  recurring_rule_id: uuidSchema.nullable(),
  installment_plan_id: uuidSchema.nullable(),
  installment_number: z.number().int().positive().nullable(),
  card_invoice_id: uuidSchema.nullable(),
  attachment_id: uuidSchema.nullable(),
  source: transactionSourceSchema,
  import_staging_id: uuidSchema.nullable(),
  external_ref: z.string().nullable(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionSchema = z.object({
  account_id: uuidSchema,
  payment_method_id: uuidSchema,
  category_id: uuidSchema,
  kind: transactionKindSchema,
  amount_cents: amountCentsSchema.positive(),
  description: z.string().max(200).nullable().optional(),
  transaction_date: isoDateSchema,
  status: transactionStatusSchema.default("cleared"),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.partial();
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
