import { currentMonthStart, useBudgets } from "../hooks/useBudgets";
import { BudgetFormDialog } from "./BudgetFormDialog";
import { BudgetRow } from "./BudgetRow";

export function BudgetsPage() {
  const periodMonth = currentMonthStart();
  const { data: budgets, isLoading } = useBudgets(periodMonth);

  const fixedBills = (budgets ?? []).filter((b) => b.kind === "fixed");
  const flexibleBudgets = (budgets ?? []).filter((b) => b.kind === "flexible");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orçamentos do mês</h1>
        <BudgetFormDialog periodMonth={periodMonth} />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (budgets ?? []).length === 0 ? (
        <p className="text-muted-foreground">Nenhum orçamento definido para este mês.</p>
      ) : (
        <>
          {fixedBills.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-medium text-muted-foreground">Contas fixas</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fixedBills.map((budget) => (
                  <BudgetRow key={budget.id} budget={budget} />
                ))}
              </div>
            </section>
          )}

          {flexibleBudgets.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-medium text-muted-foreground">Orçamentos flexíveis</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {flexibleBudgets.map((budget) => (
                  <BudgetRow key={budget.id} budget={budget} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
