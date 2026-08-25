import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCentsOrMask } from "@/lib/utils";

export interface MetricDetailRow {
  id: string;
  label: string;
  amount_cents: number;
  color?: string | null;
}

export function MetricDetailDialog({
  open,
  onOpenChange,
  title,
  rows,
  emptyMessage,
  hidden = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  rows: MetricDetailRow[];
  emptyMessage: string;
  hidden?: boolean;
}) {
  const total = rows.reduce((sum, r) => sum + r.amount_cents, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  {row.color && (
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                  )}
                  {row.label}
                </span>
                <span className="font-medium">{formatCentsOrMask(row.amount_cents, hidden)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-border px-2 pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>{formatCentsOrMask(total, hidden)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
