import { describe, expect, it } from "vitest";
import { resolveInvoicePeriod } from "../invoicePeriod";

describe("resolveInvoicePeriod", () => {
  it("assigns a purchase before closing day to the current month's invoice", () => {
    const result = resolveInvoicePeriod({ closing_day: 20, due_day: 27 }, "2026-03-10");
    expect(result.reference_month).toBe("2026-03-01");
    expect(result.closing_date).toBe("2026-03-20");
    expect(result.due_date).toBe("2026-03-27");
  });

  it("assigns a purchase exactly on the closing day to the current month's invoice", () => {
    const result = resolveInvoicePeriod({ closing_day: 20, due_day: 27 }, "2026-03-20");
    expect(result.reference_month).toBe("2026-03-01");
  });

  it("rolls a purchase after closing day into next month's invoice", () => {
    const result = resolveInvoicePeriod({ closing_day: 20, due_day: 27 }, "2026-03-21");
    expect(result.reference_month).toBe("2026-04-01");
    expect(result.closing_date).toBe("2026-04-20");
    expect(result.due_date).toBe("2026-04-27");
  });

  it("rolls the due date into the following month when due_day <= closing_day", () => {
    const result = resolveInvoicePeriod({ closing_day: 28, due_day: 5 }, "2026-03-10");
    expect(result.reference_month).toBe("2026-03-01");
    expect(result.closing_date).toBe("2026-03-28");
    expect(result.due_date).toBe("2026-04-05");
  });

  it("clamps closing_day greater than the days in the reference month", () => {
    // February (28 days in 2026) with closing_day=31 -> closes on the 28th
    const result = resolveInvoicePeriod({ closing_day: 31, due_day: 10 }, "2026-02-25");
    expect(result.reference_month).toBe("2026-02-01");
    expect(result.closing_date).toBe("2026-02-28");
  });

  it("rolls year boundary correctly", () => {
    const result = resolveInvoicePeriod({ closing_day: 20, due_day: 27 }, "2026-12-25");
    expect(result.reference_month).toBe("2027-01-01");
    expect(result.closing_date).toBe("2027-01-20");
  });
});
