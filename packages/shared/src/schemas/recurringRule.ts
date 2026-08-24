import { z } from "zod";
import { amountCentsSchema, isoDateSchema, uuidSchema } from "./common";

export const recurrenceFrequencySchema = z.enum(["daily", "weekly", "monthly", "yearly"]);
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>;

export const recurrenceEndTypeSchema = z.enum(["date", "occurrences", "infinite"]);
export type RecurrenceEndType = z.infer<typeof recurrenceEndTypeSchema>;

export const recurringKindSchema = z.enum(["income", "expense"]);

export const recurringRuleSchema = z
  .object({
    id: uuidSchema,
    user_id: uuidSchema,
    account_id: uuidSchema,
    payment_method_id: uuidSchema,
    category_id: uuidSchema,
    description: z.string().min(1).max(200),
    amount_cents: amountCentsSchema.positive(),
    kind: recurringKindSchema,
    frequency: recurrenceFrequencySchema,
    interval: z.number().int().positive().default(1),
    start_date: isoDateSchema,
    end_type: recurrenceEndTypeSchema,
    end_date: isoDateSchema.nullable(),
    occurrences_total: z.number().int().positive().nullable(),
    occurrences_generated: z.number().int().nonnegative(),
    next_run_date: isoDateSchema,
    is_active: z.boolean(),
  })
  .refine((v) => (v.end_type === "date" ? v.end_date !== null : true), {
    message: "end_date is required when end_type is 'date'",
  })
  .refine((v) => (v.end_type === "occurrences" ? v.occurrences_total !== null : true), {
    message: "occurrences_total is required when end_type is 'occurrences'",
  });
export type RecurringRule = z.infer<typeof recurringRuleSchema>;

export const createRecurringRuleSchema = z.object({
  account_id: uuidSchema,
  payment_method_id: uuidSchema,
  category_id: uuidSchema,
  description: z.string().min(1).max(200),
  amount_cents: amountCentsSchema.positive(),
  kind: recurringKindSchema,
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().positive().default(1),
  start_date: isoDateSchema,
  end_type: recurrenceEndTypeSchema,
  end_date: isoDateSchema.nullable().optional(),
  occurrences_total: z.number().int().positive().nullable().optional(),
});
export type CreateRecurringRuleInput = z.infer<typeof createRecurringRuleSchema>;
