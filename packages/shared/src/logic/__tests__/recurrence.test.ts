import { describe, expect, it } from "vitest";
import { calcNextRecurrenceDate, type RecurrenceRuleInput } from "../recurrence";

function baseRule(overrides: Partial<RecurrenceRuleInput> = {}): RecurrenceRuleInput {
  return {
    frequency: "monthly",
    interval: 1,
    start_date: "2026-01-15",
    end_type: "infinite",
    end_date: null,
    occurrences_total: null,
    occurrences_generated: 1,
    ...overrides,
  };
}

describe("calcNextRecurrenceDate", () => {
  it("steps daily by interval", () => {
    const rule = baseRule({ frequency: "daily", interval: 3, start_date: "2026-01-01" });
    expect(calcNextRecurrenceDate(rule, "2026-01-01")).toBe("2026-01-04");
  });

  it("steps weekly by interval", () => {
    const rule = baseRule({ frequency: "weekly", interval: 2, start_date: "2026-01-01" });
    expect(calcNextRecurrenceDate(rule, "2026-01-01")).toBe("2026-01-15");
  });

  it("steps monthly preserving the anchor day", () => {
    const rule = baseRule({ start_date: "2026-01-15" });
    expect(calcNextRecurrenceDate(rule, "2026-01-15")).toBe("2026-02-15");
  });

  it("clamps monthly anchor day 31 into a shorter month", () => {
    const rule = baseRule({ start_date: "2026-01-31" });
    expect(calcNextRecurrenceDate(rule, "2026-01-31")).toBe("2026-02-28");
  });

  it("restores the anchor day once the month is long enough again", () => {
    const rule = baseRule({ start_date: "2026-01-31" });
    expect(calcNextRecurrenceDate(rule, "2026-02-28")).toBe("2026-03-31");
  });

  it("handles yearly recurrence across a leap year", () => {
    const rule = baseRule({ frequency: "yearly", start_date: "2024-02-29" });
    // 2025 is not a leap year: clamp to Feb 28
    expect(calcNextRecurrenceDate(rule, "2024-02-29")).toBe("2025-02-28");
  });

  it("returns null once next occurrence is past end_date", () => {
    const rule = baseRule({ end_type: "date", end_date: "2026-02-10", start_date: "2026-01-15" });
    expect(calcNextRecurrenceDate(rule, "2026-01-15")).toBeNull();
  });

  it("allows an occurrence landing exactly on end_date", () => {
    const rule = baseRule({ end_type: "date", end_date: "2026-02-15", start_date: "2026-01-15" });
    expect(calcNextRecurrenceDate(rule, "2026-01-15")).toBe("2026-02-15");
  });

  it("returns null once occurrences_total is reached", () => {
    const rule = baseRule({ end_type: "occurrences", occurrences_total: 3, occurrences_generated: 3 });
    expect(calcNextRecurrenceDate(rule, "2026-03-15")).toBeNull();
  });

  it("keeps generating while under occurrences_total", () => {
    const rule = baseRule({ end_type: "occurrences", occurrences_total: 3, occurrences_generated: 2 });
    expect(calcNextRecurrenceDate(rule, "2026-02-15")).toBe("2026-03-15");
  });
});
