import { z } from "zod";
import { amountCentsSchema, isoDateSchema, uuidSchema } from "./common";

export const budgetKindSchema = z.enum(["flexible", "fixed"]);
export type BudgetKind = z.infer<typeof budgetKindSchema>;

export const budgetSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  category_id: uuidSchema,
  period_month: isoDateSchema,
  limit_cents: amountCentsSchema.positive(),
  alert_thresholds: z.array(z.number().int().min(1).max(200)).default([80, 100]),
  kind: budgetKindSchema,
  description: z.string().min(1).max(120).nullable(),
  due_day: z.number().int().min(1).max(31).nullable(),
  paid_at: z.string().nullable(),
});
export type Budget = z.infer<typeof budgetSchema>;

const fixedBillRequiresDescriptionAndDueDay = (v: { kind: BudgetKind; description?: string | null; due_day?: number | null }) =>
  v.kind === "flexible" || (v.description && v.due_day);

export const createBudgetSchema = budgetSchema
  .omit({ id: true, user_id: true, paid_at: true })
  .extend({
    kind: budgetKindSchema.default("flexible"),
    description: z.string().min(1).max(120).nullable().optional(),
    due_day: z.number().int().min(1).max(31).nullable().optional(),
  })
  .refine(fixedBillRequiresDescriptionAndDueDay, {
    message: "Contas fixas exigem descrição e dia de vencimento",
    path: ["description"],
  });
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = budgetSchema
  .omit({ id: true, user_id: true, period_month: true, paid_at: true })
  .partial()
  .extend({ kind: budgetKindSchema })
  .refine(fixedBillRequiresDescriptionAndDueDay, {
    message: "Contas fixas exigem descrição e dia de vencimento",
    path: ["description"],
  });
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
