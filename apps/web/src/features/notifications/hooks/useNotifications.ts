import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationRead } from "../api/notifications";

const KEY = ["notifications"];

export function useNotifications() {
  return useQuery({ queryKey: KEY, queryFn: listNotifications, refetchInterval: 60_000 });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
