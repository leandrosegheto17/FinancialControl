import type { CreatePaymentMethodInput } from "@financial-control/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPaymentMethod, deactivatePaymentMethod, listPaymentMethods } from "../api/paymentMethods";

const KEY = ["payment-methods"];

export function usePaymentMethods() {
  return useQuery({ queryKey: KEY, queryFn: listPaymentMethods });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentMethodInput) => createPaymentMethod(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeactivatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivatePaymentMethod(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
