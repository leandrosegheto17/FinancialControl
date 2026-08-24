import { useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents } from "@/lib/utils";
import { useCardInvoices, useCreditCards, useInvoiceTransactions } from "../hooks/useCards";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  open: "secondary",
  closed: "warning",
  paid: "success",
  overdue: "destructive",
};

const statusLabel: Record<string, string> = {
  open: "Aberta",
  closed: "Fechada",
  paid: "Paga",
  overdue: "Atrasada",
};

export function CardInvoicesPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const { data: cards } = useCreditCards();
  const { data: invoices, isLoading } = useCardInvoices(cardId);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const { data: transactions } = useInvoiceTransactions(selectedInvoiceId ?? undefined);

  const card = cards?.find((c) => c.id === cardId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Faturas — {card?.name ?? "Cartão"}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoices ?? []).map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                    >
                      <TableCell>{new Date(invoice.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</TableCell>
                      <TableCell>{formatCents(invoice.total_amount_cents)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[invoice.status]}>{statusLabel[invoice.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lançamentos da fatura</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedInvoiceId ? (
              <p className="text-muted-foreground">Selecione uma fatura para ver os lançamentos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(transactions ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{new Date(t.transaction_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{formatCents(t.amount_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
