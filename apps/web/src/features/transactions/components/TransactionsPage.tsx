import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents } from "@/lib/utils";
import { useDeleteTransaction, useTransactions } from "../hooks/useTransactions";
import { TransactionFormDialog } from "./TransactionFormDialog";

const statusLabel: Record<string, string> = { pending: "Pendente", cleared: "Confirmado", reconciled: "Conciliado" };

export function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions();
  const deleteTransaction = useDeleteTransaction();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <TransactionFormDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(transactions ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.transaction_date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  {t.description}
                  {t.installment_number && <span className="ml-1 text-xs text-muted-foreground">#{t.installment_number}</span>}
                </TableCell>
                <TableCell>{t.accounts?.name}</TableCell>
                <TableCell>{t.categories?.name}</TableCell>
                <TableCell>
                  <Badge variant={t.status === "pending" ? "secondary" : "success"}>{statusLabel[t.status]}</Badge>
                </TableCell>
                <TableCell className={`text-right ${t.kind === "income" ? "text-emerald-600" : ""}`}>
                  {t.kind === "income" ? "+" : "-"}
                  {formatCents(t.amount_cents)}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => deleteTransaction.mutate(t.id)}
                    className="text-sm text-muted-foreground hover:text-destructive"
                  >
                    Excluir
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
