import type { CreateCreditCardInput } from "@financial-control/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCreditCard,
  deactivateCreditCard,
  listCreditCards,
  listInvoicesForCard,
  listInvoiceTransactions,
} from "../api/cards";

const CARDS_KEY = ["credit-cards"];

export function useCreditCards() {
  return useQuery({ queryKey: CARDS_KEY, queryFn: listCreditCards });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreditCardInput) => createCreditCard(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  });
}

export function useDeactivateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCreditCard(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  });
}

export function useCardInvoices(creditCardId: string | undefined) {
  return useQuery({
    queryKey: ["card-invoices", creditCardId],
    queryFn: () => listInvoicesForCard(creditCardId!),
    enabled: Boolean(creditCardId),
  });
}

export function useInvoiceTransactions(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice-transactions", invoiceId],
    queryFn: () => listInvoiceTransactions(invoiceId!),
    enabled: Boolean(invoiceId),
  });
}
