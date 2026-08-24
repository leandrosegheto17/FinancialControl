import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeactivatePaymentMethod, usePaymentMethods } from "../hooks/usePaymentMethods";
import { PaymentMethodFormDialog } from "./PaymentMethodFormDialog";

const typeLabels: Record<string, string> = {
  pix: "Pix",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  boleto: "Boleto",
  cash: "Dinheiro em espécie",
};

export function PaymentMethodsPage() {
  const { data: methods, isLoading } = usePaymentMethods();
  const deactivate = useDeactivatePaymentMethod();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modos de pagamento</h1>
        <PaymentMethodFormDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(methods ?? []).map((method) => (
              <TableRow key={method.id}>
                <TableCell className="font-medium">{method.name}</TableCell>
                <TableCell>{typeLabels[method.type]}</TableCell>
                <TableCell>
                  <Badge variant={method.is_active ? "success" : "secondary"}>
                    {method.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {method.is_active && (
                    <button
                      type="button"
                      onClick={() => deactivate.mutate(method.id)}
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
