import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";
import { currentMonth, useCategoryBreakdown, useConsolidatedBalance, useMonthlySummary } from "../hooks/useDashboard";

const FALLBACK_COLORS = ["#3b82f6", "#ef4444", "#f97316", "#a855f7", "#22c55e", "#eab308", "#ec4899", "#0ea5e9"];

export function DashboardPage() {
  const month = currentMonth();
  const { data: balance } = useConsolidatedBalance();
  const { data: summary } = useMonthlySummary(month);
  const { data: breakdown } = useCategoryBreakdown(month);

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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo consolidado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCents(balance ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Receitas do mês</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">
            {formatCents(summary?.income_cents ?? 0)}
          </CardContent>
        </Card>
        <Card>
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
