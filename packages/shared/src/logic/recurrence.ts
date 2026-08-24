import type { RecurrenceEndType, RecurrenceFrequency } from "../schemas/recurringRule";
import { addDaysISO, addMonthsClampedISO, compareISODate, parseISODate } from "./date";

export interface RecurrenceRuleInput {
  frequency: RecurrenceFrequency;
  interval: number;
  start_date: string;
  end_type: RecurrenceEndType;
  end_date: string | null;
  occurrences_total: number | null;
  /** count of occurrences already materialized, including the one at `fromDate` */
  occurrences_generated: number;
}

/**
 * Given a rule and the date of the occurrence just generated (`fromDate`),
 * returns the ISO date of the next occurrence, or null if the series has
 * ended (past end_date, occurrences exhausted, or rule inactive by count).
 */
export function calcNextRecurrenceDate(rule: RecurrenceRuleInput, fromDate: string): string | null {
  if (rule.end_type === "occurrences") {
    const total = rule.occurrences_total ?? 0;
    if (rule.occurrences_generated >= total) return null;
  }

  const next = stepDate(fromDate, rule.frequency, rule.interval, parseISODate(rule.start_date).day);

  if (rule.end_type === "date" && rule.end_date !== null && compareISODate(next, rule.end_date) > 0) {
    return null;
  }

  return next;
}

function stepDate(fromDate: string, frequency: RecurrenceFrequency, interval: number, anchorDay: number): string {
  switch (frequency) {
    case "daily":
      return addDaysISO(fromDate, interval);
    case "weekly":
      return addDaysISO(fromDate, interval * 7);
    case "monthly":
      return addMonthsClampedISO(fromDate, interval, anchorDay);
    case "yearly":
      return addMonthsClampedISO(fromDate, interval * 12, anchorDay);
  }
}
