import type { CreateGoalInput } from "@financial-control/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToGoal, createGoal, deleteGoal, listGoals } from "../api/goals";

const KEY = ["goals"];

export function useGoals() {
  return useQuery({ queryKey: KEY, queryFn: listGoals });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) => createGoal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddToGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentAmountCents, deltaCents }: { id: string; currentAmountCents: number; deltaCents: number }) =>
      addToGoal(id, currentAmountCents, deltaCents),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
