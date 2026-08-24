import type { CreateAccountInput, UpdateAccountInput } from "@financial-control/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateFinancialData } from "@/lib/queryKeys";
import { createAccount, deactivateAccount, listAccounts, updateAccount } from "../api/accounts";

const ACCOUNTS_KEY = ["accounts"];

export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_KEY, queryFn: listAccounts });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) => updateAccount(id, input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useDeactivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateAccount(id),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}
