import type { Account, AccountType } from "@financial-control/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { useCreateAccount, useUpdateAccount } from "../hooks/useAccounts";

const accountTypes: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "wallet", label: "Carteira física" },
  { value: "investment", label: "Investimentos" },
];

const formSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  type: z.enum(["checking", "savings", "wallet", "investment"]),
  currency: z.string().length(3),
  initialBalance: z.coerce.number(),
});
type FormValues = z.infer<typeof formSchema>;

export function AccountFormDialog({ account }: { account?: Account }) {
  const [open, setOpen] = useState(false);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const isEdit = Boolean(account);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "checking",
      currency: account?.currency ?? "BRL",
      initialBalance: account ? account.initial_balance_cents / 100 : 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: account?.name ?? "",
        type: account?.type ?? "checking",
        currency: account?.currency ?? "BRL",
        initialBalance: account ? account.initial_balance_cents / 100 : 0,
      });
    }
  }, [open, account, reset]);

  async function onSubmit(values: FormValues) {
    const initial_balance_cents = Math.round(values.initialBalance * 100);
    if (isEdit && account) {
      await updateAccount.mutateAsync({
        id: account.id,
        input: { name: values.name, type: values.type, currency: values.currency },
      });
    } else {
      await createAccount.mutateAsync({
        name: values.name,
        type: values.type,
        currency: values.currency,
        initial_balance_cents,
        color: null,
        icon: null,
      });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "sm" : "default"}>
          {isEdit ? "Editar" : "Nova conta"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>Contas representam onde seu dinheiro está guardado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v as AccountType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="initialBalance">Saldo inicial (R$)</Label>
              <Input id="initialBalance" type="number" step="0.01" {...register("initialBalance")} />
            </div>
          )}
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
