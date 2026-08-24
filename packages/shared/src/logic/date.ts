export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

export function parseISODate(value: string): DateParts {
  const parts = value.split("-");
  return { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) };
}

export function formatISODate({ year, month, day }: DateParts): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function compareISODate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addDaysISO(value: string, days: number): string {
  const { year, month, day } = parseISODate(value);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return formatISODate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}

/**
 * Advances `value` by `months` calendar months, clamping the day to the
 * target month's length (e.g. anchor day 31 in a 30-day month -> day 30),
 * while preserving the original anchor day for months long enough to fit it.
 */
export function addMonthsClampedISO(value: string, months: number, anchorDay: number): string {
  const { year, month } = parseISODate(value);
  const totalMonths = (year * 12 + (month - 1)) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const day = Math.min(anchorDay, daysInMonth(targetYear, targetMonth));
  return formatISODate({ year: targetYear, month: targetMonth, day });
}
