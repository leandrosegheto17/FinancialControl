import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents } from "@/lib/utils";
import { useAccounts, useDeactivateAccount } from "../hooks/useAccounts";
import { AccountFormDialog } from "./AccountFormDialog";

const typeLabels: Record<string, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira física",
  investment: "Investimentos",
};

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const deactivate = useDeactivateAccount();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contas</h1>
        <AccountFormDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Saldo atual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(accounts ?? []).map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>{typeLabels[account.type]}</TableCell>
                <TableCell>{formatCents(account.current_balance_cents, account.currency)}</TableCell>
                <TableCell>
                  <Badge variant={account.is_active ? "success" : "secondary"}>
                    {account.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <AccountFormDialog account={account} />
                  {account.is_active && (
                    <button
                      type="button"
                      onClick={() => deactivate.mutate(account.id)}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Inativar
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
