import { daysInMonth, parseISODate } from "@financial-control/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCents } from "@/lib/utils";
import type { BudgetWithSpend } from "../api/budgets";
import { useCategorySpend, useDeleteBudget } from "../hooks/useBudgets";

function resolveDueDate(periodMonth: string, dueDay: number): Date {
  const { year, month } = parseISODate(periodMonth);
  const day = Math.min(dueDay, daysInMonth(year, month));
  return new Date(year, month - 1, day);
}

function FixedBillStatusBadge({ dueDate, paid }: { dueDate: Date; paid: boolean }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (paid) return <Badge variant="success">Paga</Badge>;
  if (daysUntilDue < 0) return <Badge variant="destructive">Atrasada</Badge>;
  if (daysUntilDue === 0) return <Badge variant="warning">Vence hoje</Badge>;
  if (daysUntilDue <= 3) return <Badge variant="warning">Vence em {daysUntilDue}d</Badge>;
  return (
    <Badge variant="outline">
      Vence {dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
    </Badge>
  );
}

export function BudgetRow({ budget }: { budget: BudgetWithSpend }) {
  const { data: spent } = useCategorySpend(budget.category_id, budget.period_month);
  const deleteBudget = useDeleteBudget();
  const spentCents = spent ?? 0;
  const pct = Math.min(100, Math.round((spentCents / budget.limit_cents) * 100));
  const overLimit = spentCents > budget.limit_cents;
  const isFixed = budget.kind === "fixed";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{isFixed ? budget.description : budget.categories?.name}</CardTitle>
          {isFixed && <p className="text-xs text-muted-foreground">{budget.categories?.name}</p>}
        </div>
        <button
          type="button"
          onClick={() => deleteBudget.mutate(budget.id)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Remover
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isFixed && budget.due_day ? (
          <FixedBillStatusBadge dueDate={resolveDueDate(budget.period_month, budget.due_day)} paid={spentCents > 0} />
        ) : (
          <Progress value={pct} indicatorClassName={overLimit ? "bg-destructive" : undefined} />
        )}
        <p className="text-sm text-muted-foreground">
          {isFixed
            ? formatCents(budget.limit_cents)
            : `${formatCents(spentCents)} de ${formatCents(budget.limit_cents)} (${pct}%)`}
        </p>
      </CardContent>
    </Card>
  );
}
