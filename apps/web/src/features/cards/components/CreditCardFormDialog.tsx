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
import { useCreateCreditCard } from "../hooks/useCards";

const formSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  brand: z.string().optional(),
  limit: z.coerce.number().min(0),
  closing_day: z.coerce.number().int().min(1).max(31),
  due_day: z.coerce.number().int().min(1).max(31),
  payment_account_id: z.string().uuid("Selecione a conta de pagamento"),
});
type FormValues = z.infer<typeof formSchema>;

export function CreditCardFormDialog() {
  const [open, setOpen] = useState(false);
  const { data: accounts } = useAccounts();
  const createCard = useCreateCreditCard();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", brand: "", limit: 0, closing_day: 1, due_day: 10, payment_account_id: "" },
  });

  async function onSubmit(values: FormValues) {
    await createCard.mutateAsync({
      name: values.name,
      brand: values.brand || null,
      limit_cents: Math.round(values.limit * 100),
      closing_day: values.closing_day,
      due_day: values.due_day,
      payment_account_id: values.payment_account_id,
      color: null,
      icon: null,
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo cartão</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cartão de crédito</DialogTitle>
          <DialogDescription>Defina o dia de fechamento e vencimento da fatura.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand">Bandeira</Label>
            <Input id="brand" {...register("brand")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="limit">Limite (R$)</Label>
              <Input id="limit" type="number" step="0.01" {...register("limit")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="closing_day">Dia de fechamento</Label>
              <Input id="closing_day" type="number" min={1} max={31} {...register("closing_day")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="due_day">Dia de vencimento</Label>
            <Input id="due_day" type="number" min={1} max={31} {...register("due_day")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Conta para pagamento da fatura</Label>
            <Select value={watch("payment_account_id")} onValueChange={(v) => setValue("payment_account_id", v)}>
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
            {errors.payment_account_id && <p className="text-sm text-destructive">{errors.payment_account_id.message}</p>}
          </div>
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
