import type { CreateBudgetInput, UpdateBudgetInput } from "@financial-control/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancialData } from "@/lib/queryKeys";
import {
  createBudget,
  deleteBudget,
  getCategorySpend,
  listBudgetsForMonth,
  setBudgetPaid,
  updateBudget,
} from "../api/budgets";

export function currentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export function shiftMonth(periodMonth: string, delta: number): string {
  const parts = periodMonth.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  return new Date(year, month - 1 + delta, 1).toISOString().slice(0, 10);
}

export function useBudgets(periodMonth: string) {
  return useQuery({ queryKey: ["budgets", periodMonth], queryFn: () => listBudgetsForMonth(periodMonth) });
}

export function useCategorySpend(categoryId: string, periodMonth: string) {
  return useQuery({
    queryKey: ["category-spend", categoryId, periodMonth],
    queryFn: () => getCategorySpend(categoryId, periodMonth),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => createBudget(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) => updateBudget(id, input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useSetBudgetPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) => setBudgetPaid(id, paid),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}
