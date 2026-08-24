import type { CreateInstallmentPlanInput, CreateRecurringRuleInput, CreateTransactionInput } from "@financial-control/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancialData } from "@/lib/queryKeys";
import {
  createInstallmentPlanWithTransactions,
  createRecurringRule,
  createTransaction,
  deleteTransaction,
  listTransactions,
} from "../api/transactions";

const KEY = ["transactions"];

export function useTransactions() {
  return useQuery({ queryKey: KEY, queryFn: listTransactions });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useCreateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecurringRuleInput) => createRecurringRule(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useCreateInstallmentPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInstallmentPlanInput) => createInstallmentPlanWithTransactions(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}
