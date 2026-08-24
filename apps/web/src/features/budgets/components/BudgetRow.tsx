import { daysInMonth, parseISODate } from "@financial-control/shared";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCents } from "@/lib/utils";
import type { BudgetWithSpend } from "../api/budgets";
import { useCategorySpend, useDeleteBudget, useSetBudgetPaid } from "../hooks/useBudgets";
import { BudgetFormDialog } from "./BudgetFormDialog";

function resolveDueDate(periodMonth: string, dueDay: number): Date {
  const { year, month } = parseISODate(periodMonth);
  const day = Math.min(dueDay, daysInMonth(year, month));
  return new Date(year, month - 1, day);
}

function formatDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()}`;
}

function FixedBillStatusBadge({ dueDate, paid }: { dueDate: Date; paid: boolean }) {
  if (paid) return <Badge variant="success">Paga</Badge>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (daysUntilDue < 0) return <Badge variant="destructive">Atrasada</Badge>;
  if (daysUntilDue === 0) return <Badge variant="warning">Vence hoje</Badge>;
  if (daysUntilDue <= 3) return <Badge variant="warning">Vence em {daysUntilDue}d</Badge>;
  return <Badge variant="outline">A vencer</Badge>;
}

export function BudgetRow({ budget }: { budget: BudgetWithSpend }) {
  const { data: spent } = useCategorySpend(budget.category_id, budget.period_month);
  const deleteBudget = useDeleteBudget();
  const setPaid = useSetBudgetPaid();
  const spentCents = spent ?? 0;
  const pct = Math.min(100, Math.round((spentCents / budget.limit_cents) * 100));
  const overLimit = spentCents > budget.limit_cents;
  const isFixed = budget.kind === "fixed";
  const isPaid = Boolean(budget.paid_at);
  const categoryColor = budget.categories?.color ?? "#94a3b8";
  const dueDate = isFixed && budget.due_day ? resolveDueDate(budget.period_month, budget.due_day) : null;

  return (
    <Card style={{ borderLeft: `4px solid ${categoryColor}` }}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{isFixed ? budget.description : budget.categories?.name}</CardTitle>
          {isFixed && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor }} />
              {budget.categories?.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BudgetFormDialog periodMonth={budget.period_month} budget={budget} />
          <button
            type="button"
            onClick={() => deleteBudget.mutate(budget.id)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remover
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isFixed && dueDate ? (
          <>
            <FixedBillStatusBadge dueDate={dueDate} paid={isPaid} />
            <p className="text-xs text-muted-foreground">Vencimento: {formatDDMMYYYY(dueDate)}</p>
          </>
        ) : (
          <Progress value={pct} indicatorClassName={overLimit ? "bg-destructive" : undefined} />
        )}
        <p className="text-sm text-muted-foreground">
          {isFixed
            ? formatCents(budget.limit_cents)
            : `${formatCents(spentCents)} de ${formatCents(budget.limit_cents)} (${pct}%)`}
        </p>
        {isFixed && (
          <Button
            type="button"
            variant={isPaid ? "outline" : "secondary"}
            size="sm"
            className="w-fit"
            onClick={() => setPaid.mutate({ id: budget.id, paid: !isPaid })}
            disabled={setPaid.isPending}
          >
            {isPaid ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPaid ? "Desmarcar pago" : "Marcar como pago"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
