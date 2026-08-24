import { z } from "zod";

export const amountCentsSchema = z.number().int();

export const currencySchema = z.string().length(3);

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const uuidSchema = z.string().uuid();
