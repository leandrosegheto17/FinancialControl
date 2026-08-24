import { useQuery } from "@tanstack/react-query";
import { getCategoryBreakdown, getConsolidatedBalance, getMonthlySummary } from "../api/dashboard";

export function currentMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export function useMonthlySummary(month: string) {
  return useQuery({ queryKey: ["monthly-summary", month], queryFn: () => getMonthlySummary(month) });
}

export function useCategoryBreakdown(month: string) {
  return useQuery({ queryKey: ["category-breakdown", month], queryFn: () => getCategoryBreakdown(month) });
}

export function useConsolidatedBalance() {
  return useQuery({ queryKey: ["consolidated-balance"], queryFn: getConsolidatedBalance });
}
