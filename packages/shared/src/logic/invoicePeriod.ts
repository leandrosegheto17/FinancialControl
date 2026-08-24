import { daysInMonth, formatISODate, parseISODate } from "./date";

export interface CreditCardScheduleInput {
  closing_day: number;
  due_day: number;
}

export interface InvoicePeriod {
  /** first day of the invoice's reference month, ISO */
  reference_month: string;
  closing_date: string;
  due_date: string;
}

/**
 * Resolves which invoice a purchase belongs to. A purchase made on or
 * before the card's closing day falls into the invoice closing that same
 * month; after the closing day, it rolls into the following month's
 * invoice. `closing_day`/`due_day` are clamped to the target month's
 * length (e.g. closing_day=31 in a 30-day month closes on day 30).
 */
export function resolveInvoicePeriod(card: CreditCardScheduleInput, transactionDate: string): InvoicePeriod {
  const { year, month, day } = parseISODate(transactionDate);
  const clampedClosingThisMonth = Math.min(card.closing_day, daysInMonth(year, month));

  const [refYear, refMonth] =
    day > clampedClosingThisMonth ? addMonth(year, month, 1) : [year, month];

  const closingDay = Math.min(card.closing_day, daysInMonth(refYear, refMonth));
  const closingDate = formatISODate({ year: refYear, month: refMonth, day: closingDay });

  const [dueYear, dueMonth] =
    card.due_day <= card.closing_day ? addMonth(refYear, refMonth, 1) : [refYear, refMonth];
  const dueDay = Math.min(card.due_day, daysInMonth(dueYear, dueMonth));
  const dueDate = formatISODate({ year: dueYear, month: dueMonth, day: dueDay });

  return {
    reference_month: formatISODate({ year: refYear, month: refMonth, day: 1 }),
    closing_date: closingDate,
    due_date: dueDate,
  };
}

function addMonth(year: number, month: number, delta: number): [number, number] {
  const total = year * 12 + (month - 1) + delta;
  return [Math.floor(total / 12), (total % 12) + 1];
}
