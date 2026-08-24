import type { CreateBudgetInput } from "@financial-control/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBudget, deleteBudget, getCategorySpend, listBudgetsForMonth } from "../api/budgets";

export function currentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
