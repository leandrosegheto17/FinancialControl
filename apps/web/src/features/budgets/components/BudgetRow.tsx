import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCents } from "@/lib/utils";
import type { BudgetWithSpend } from "../api/budgets";
import { useCategorySpend, useDeleteBudget } from "../hooks/useBudgets";

export function BudgetRow({ budget }: { budget: BudgetWithSpend }) {
  const { data: spent } = useCategorySpend(budget.category_id, budget.period_month);
  const deleteBudget = useDeleteBudget();
  const spentCents = spent ?? 0;
  const pct = Math.min(100, Math.round((spentCents / budget.limit_cents) * 100));
  const overLimit = spentCents > budget.limit_cents;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{budget.categories?.name}</CardTitle>
        <button type="button" onClick={() => deleteBudget.mutate(budget.id)} className="text-xs text-muted-foreground hover:text-destructive">
          Remover
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Progress value={pct} indicatorClassName={overLimit ? "bg-destructive" : undefined} />
        <p className="text-sm text-muted-foreground">
          {formatCents(spentCents)} de {formatCents(budget.limit_cents)} ({pct}%)
        </p>
      </CardContent>
    </Card>
  );
}
