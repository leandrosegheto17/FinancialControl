import { currentMonthStart, useBudgets } from "../hooks/useBudgets";
import { BudgetFormDialog } from "./BudgetFormDialog";
import { BudgetRow } from "./BudgetRow";

export function BudgetsPage() {
  const periodMonth = currentMonthStart();
  const { data: budgets, isLoading } = useBudgets(periodMonth);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orçamentos do mês</h1>
        <BudgetFormDialog periodMonth={periodMonth} />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (budgets ?? []).length === 0 ? (
        <p className="text-muted-foreground">Nenhum orçamento definido para este mês.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(budgets ?? []).map((budget) => (
            <BudgetRow key={budget.id} budget={budget} />
          ))}
        </div>
      )}
    </div>
  );
}
