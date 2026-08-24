import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { currentMonthStart, shiftMonth, useBudgets } from "../hooks/useBudgets";
import { BudgetFormDialog } from "./BudgetFormDialog";
import { BudgetRow } from "./BudgetRow";

function formatMonthLabel(periodMonth: string): string {
  const parts = periodMonth.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function BudgetsPage() {
  const [periodMonth, setPeriodMonth] = useState(currentMonthStart());
  const { data: budgets, isLoading } = useBudgets(periodMonth);

  const fixedBills = (budgets ?? []).filter((b) => b.kind === "fixed");
  const flexibleBudgets = (budgets ?? []).filter((b) => b.kind === "flexible");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Orçamentos</h1>
        <BudgetFormDialog periodMonth={periodMonth} />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setPeriodMonth((m) => shiftMonth(m, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="w-40 text-center text-sm font-medium">{formatMonthLabel(periodMonth)}</span>
        <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setPeriodMonth((m) => shiftMonth(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
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
