import type { Goal } from "@financial-control/shared";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatCents } from "@/lib/utils";
import { useAddToGoal, useDeleteGoal, useGoals } from "../hooks/useGoals";
import { GoalFormDialog } from "./GoalFormDialog";

function GoalCard({ goal }: { goal: Goal }) {
  const [amount, setAmount] = useState("");
  const addToGoal = useAddToGoal();
  const deleteGoal = useDeleteGoal();
  const pct = Math.min(100, Math.round((goal.current_amount_cents / goal.target_amount_cents) * 100));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{goal.name}</CardTitle>
        <button type="button" onClick={() => deleteGoal.mutate(goal.id)} className="text-xs text-muted-foreground hover:text-destructive">
          Remover
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={pct} />
        <p className="text-sm text-muted-foreground">
          {formatCents(goal.current_amount_cents)} de {formatCents(goal.target_amount_cents)} ({pct}%)
        </p>
        {goal.linked_account_id ? (
          <p className="text-xs text-muted-foreground">Progresso automático via conta vinculada.</p>
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const cents = Math.round(Number(amount) * 100);
                if (cents > 0) {
                  addToGoal.mutate({ id: goal.id, currentAmountCents: goal.current_amount_cents, deltaCents: cents });
                  setAmount("");
                }
              }}
            >
              Adicionar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GoalsPage() {
  const { data: goals, isLoading } = useGoals();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Metas</h1>
        <GoalFormDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(goals ?? []).map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
