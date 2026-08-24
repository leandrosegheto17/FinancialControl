import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";
import { useCreditCards, useDeactivateCreditCard } from "../hooks/useCards";
import { CreditCardFormDialog } from "./CreditCardFormDialog";

export function CardsPage() {
  const { data: cards, isLoading } = useCreditCards();
  const deactivate = useDeactivateCreditCard();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões de crédito</h1>
        <CreditCardFormDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(cards ?? []).map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Link to={`/cards/${card.id}`} className="hover:underline">
                    {card.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>{card.brand}</p>
                <p>Limite: {formatCents(card.limit_cents)}</p>
                <p>
                  Fecha dia {card.closing_day} · Vence dia {card.due_day}
                </p>
                {card.is_active && (
                  <button
                    type="button"
                    onClick={() => deactivate.mutate(card.id)}
                    className="mt-2 w-fit text-xs text-muted-foreground hover:text-destructive"
                  >
                    Inativar
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
