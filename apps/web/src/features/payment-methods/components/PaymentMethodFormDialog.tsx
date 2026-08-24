import type { PaymentMethodType } from "@financial-control/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCreditCards } from "@/features/cards/hooks/useCards";
import { useCreatePaymentMethod } from "../hooks/usePaymentMethods";

const typeOptions: { value: PaymentMethodType; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "boleto", label: "Boleto" },
  { value: "cash", label: "Dinheiro em espécie" },
];

const formSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  type: z.enum(["pix", "debit_card", "credit_card", "boleto", "cash"]),
  account_id: z.string().optional(),
  credit_card_id: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function PaymentMethodFormDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: accounts } = useAccounts();
  const { data: creditCards } = useCreditCards();
  const createPaymentMethod = useCreatePaymentMethod();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", type: "pix", account_id: "", credit_card_id: "" },
  });

  const type = watch("type");

  async function onSubmit(values: FormValues) {
    setError(null);
    if (values.type === "credit_card" && !values.credit_card_id) {
      setError("Selecione o cartão de crédito.");
      return;
    }
    if (values.type !== "credit_card" && !values.account_id) {
      setError("Selecione a conta associada.");
      return;
    }
    await createPaymentMethod.mutateAsync({
      name: values.name,
      type: values.type,
      account_id: values.type === "credit_card" ? null : values.account_id,
      credit_card_id: values.type === "credit_card" ? values.credit_card_id : null,
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo modo de pagamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo modo de pagamento</DialogTitle>
          <DialogDescription>Associe a uma conta ou a um cartão de crédito.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setValue("type", v as PaymentMethodType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "credit_card" ? (
            <div className="flex flex-col gap-1.5">
              <Label>Cartão de crédito</Label>
              <Select value={watch("credit_card_id")} onValueChange={(v) => setValue("credit_card_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {(creditCards ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label>Conta</Label>
              <Select value={watch("account_id")} onValueChange={(v) => setValue("account_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {(accounts ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
