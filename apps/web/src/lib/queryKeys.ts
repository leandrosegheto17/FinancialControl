import type { QueryClient } from "@tanstack/react-query";

/**
 * Query key prefixes for every read that can be affected by a change to
 * accounts, transactions, recurring rules or installment plans. Mutations
 * in those features invalidate this whole set — the alternative (each
 * mutation guessing which dashboard/report queries it happens to affect)
 * has repeatedly gone stale as new consumers were added.
 */
export const FINANCIAL_IMPACT_KEYS = [
  "accounts",
  "consolidated-balance",
  "monthly-summary",
  "category-breakdown",
  "category-spend",
  "budgets",
  "card-invoices",
  "invoice-transactions",
  "transactions",
  "goals",
];

export function invalidateFinancialData(queryClient: QueryClient): void {
  for (const key of FINANCIAL_IMPACT_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
