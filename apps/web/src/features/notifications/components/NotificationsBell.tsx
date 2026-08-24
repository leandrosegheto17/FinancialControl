import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMarkNotificationRead, useNotifications } from "../hooks/useNotifications";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Notificações" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar notificações"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-4 top-16 z-50 flex max-h-96 w-80 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-md border border-border bg-card p-2 shadow-lg">
            {(notifications ?? []).length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
            ) : (
              (notifications ?? []).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read_at && markRead.mutate(n.id)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-md p-2 text-left text-sm hover:bg-accent",
                    !n.read_at && "bg-accent/50"
                  )}
                >
                  <span className="font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.body}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("pt-BR")}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
