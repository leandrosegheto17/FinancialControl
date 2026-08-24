import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";
import {
  currentMonth,
  useAccountBalances,
  useBudgetProvision,
  useCategoryBreakdown,
  useConsolidatedBalance,
  useIncomeBreakdown,
  useMonthlySummary,
} from "../hooks/useDashboard";
import { MetricDetailDialog } from "./MetricDetailDialog";

const FALLBACK_COLORS = ["#3b82f6", "#ef4444", "#f97316", "#a855f7", "#22c55e", "#eab308", "#ec4899", "#0ea5e9"];

type DetailMetric = "balance" | "income" | "expense" | null;

export function DashboardPage() {
  const month = currentMonth();
  const { data: balance } = useConsolidatedBalance();
  const { data: summary } = useMonthlySummary(month);
  const { data: breakdown } = useCategoryBreakdown(month);
  const { data: provision } = useBudgetProvision(month);
  const { data: accountBalances } = useAccountBalances();
  const { data: incomeBreakdown } = useIncomeBreakdown(month);
  const [detailMetric, setDetailMetric] = useState<DetailMetric>(null);
  const projectedBalanceCents = (summary?.income_cents ?? 0) - (provision?.total_cents ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/transactions">Novo lançamento</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => setDetailMetric("balance")}
        >
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo consolidado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCents(balance ?? 0)}</CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => setDetailMetric("income")}
        >
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Receitas do mês</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">
            {formatCents(summary?.income_cents ?? 0)}
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => setDetailMetric("expense")}
        >
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Despesas do mês</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            {formatCents(summary?.expense_cents ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo do mês</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCents(summary?.balance_cents ?? 0)}</CardContent>
        </Card>
      </div>

      <MetricDetailDialog
        open={detailMetric === "balance"}
        onOpenChange={(open) => setDetailMetric(open ? "balance" : null)}
        title="Saldo consolidado por conta"
        emptyMessage="Nenhuma conta ativa."
        rows={(accountBalances ?? []).map((a) => ({ id: a.id, label: a.name, amount_cents: a.current_balance_cents }))}
      />
      <MetricDetailDialog
        open={detailMetric === "income"}
        onOpenChange={(open) => setDetailMetric(open ? "income" : null)}
        title="Receitas do mês por categoria"
        emptyMessage="Nenhuma receita registrada este mês."
        rows={(incomeBreakdown ?? []).map((c) => ({
          id: c.category_id,
          label: c.category_name,
          amount_cents: c.amount_cents,
          color: c.category_color,
        }))}
      />
      <MetricDetailDialog
        open={detailMetric === "expense"}
        onOpenChange={(open) => setDetailMetric(open ? "expense" : null)}
        title="Despesas do mês por categoria"
        emptyMessage="Nenhuma despesa registrada este mês."
        rows={(breakdown ?? []).map((c) => ({
          id: c.category_id,
          label: c.category_name,
          amount_cents: c.amount_cents,
          color: c.category_color,
        }))}
      />

      {provision && provision.total_cents > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Provisionado do mês</CardTitle>
            <p className="text-sm text-muted-foreground">
              Se todas as contas fixas forem pagas e os orçamentos flexíveis chegarem a 100% do limite.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Contas fixas</p>
                <p className="text-xl font-semibold">{formatCents(provision.fixed_cents)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orçamentos flexíveis (100%)</p>
                <p className="text-xl font-semibold">{formatCents(provision.flexible_cents)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total provisionado</p>
                <p className="text-xl font-semibold">{formatCents(provision.total_cents)}</p>
              </div>
            </div>
            <p className={`text-sm ${projectedBalanceCents < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              Saldo projetado do mês (receitas − provisionado): {formatCents(projectedBalanceCents)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gastos por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {!breakdown || breakdown.length === 0 ? (
            <p className="text-muted-foreground">Sem despesas registradas este mês.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="amount_cents" nameKey="category_name" innerRadius={60} outerRadius={100}>
                    {breakdown.map((entry, i) => (
                      <Cell key={entry.category_id} fill={entry.category_color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCents(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
