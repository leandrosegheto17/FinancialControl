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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { usePaymentMethods } from "@/features/payment-methods/hooks/usePaymentMethods";
import { useCreateInstallmentPlan, useCreateRecurringRule, useCreateTransaction } from "../hooks/useTransactions";

const today = () => new Date().toISOString().slice(0, 10);

const baseFields = {
  description: z.string().min(1, "Informe uma descrição"),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  account_id: z.string().uuid("Selecione a conta"),
  payment_method_id: z.string().uuid("Selecione o modo de pagamento"),
  category_id: z.string().uuid("Selecione a categoria"),
  date: z.string().min(1),
};

const manualSchema = z.object({ ...baseFields, kind: z.enum(["income", "expense"]) });
const recurringSchema = z.object({
  ...baseFields,
  kind: z.enum(["income", "expense"]),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
});
const installmentSchema = z.object({ ...baseFields, installments_count: z.coerce.number().int().min(2).max(60) });

function ManualForm({ onDone }: { onDone: () => void }) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: paymentMethods } = usePaymentMethods();
  const createTransaction = useCreateTransaction();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof manualSchema>>({
    resolver: zodResolver(manualSchema),
    defaultValues: { kind: "expense", date: today(), description: "", amount: 0, account_id: "", payment_method_id: "", category_id: "" },
  });
  const kind = watch("kind");

  async function onSubmit(values: z.infer<typeof manualSchema>) {
    await createTransaction.mutateAsync({
      description: values.description,
      amount_cents: Math.round(values.amount * 100),
      transaction_date: values.date,
      account_id: values.account_id,
      payment_method_id: values.payment_method_id,
      category_id: values.category_id,
      kind: values.kind,
      status: "cleared",
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <Select value={kind} onValueChange={(v) => setValue("kind", v as "income" | "expense")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Despesa</SelectItem>
            <SelectItem value="income">Receita</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input id="amount" type="number" step="0.01" {...register("amount")} />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" {...register("date")} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Conta</Label>
        <Select value={watch("account_id")} onValueChange={(v) => setValue("account_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(accounts ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Modo de pagamento</Label>
        <Select value={watch("payment_method_id")} onValueChange={(v) => setValue("payment_method_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(paymentMethods ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.payment_method_id && <p className="text-sm text-destructive">{errors.payment_method_id.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <Select value={watch("category_id")} onValueChange={(v) => setValue("category_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(categories ?? []).filter((c) => c.kind === kind).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}

function RecurringForm({ onDone }: { onDone: () => void }) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: paymentMethods } = usePaymentMethods();
  const createRecurringRule = useCreateRecurringRule();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof recurringSchema>>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      kind: "expense",
      frequency: "monthly",
      date: today(),
      description: "",
      amount: 0,
      account_id: "",
      payment_method_id: "",
      category_id: "",
    },
  });
  const kind = watch("kind");

  async function onSubmit(values: z.infer<typeof recurringSchema>) {
    await createRecurringRule.mutateAsync({
      description: values.description,
      amount_cents: Math.round(values.amount * 100),
      account_id: values.account_id,
      payment_method_id: values.payment_method_id,
      category_id: values.category_id,
      kind: values.kind,
      frequency: values.frequency,
      interval: 1,
      start_date: values.date,
      end_type: "infinite",
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select value={kind} onValueChange={(v) => setValue("kind", v as "income" | "expense")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Despesa</SelectItem>
              <SelectItem value="income">Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Frequência</Label>
          <Select value={watch("frequency")} onValueChange={(v) => setValue("frequency", v as "daily" | "weekly" | "monthly" | "yearly")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diária</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-description">Descrição</Label>
        <Input id="r-description" {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="r-amount">Valor (R$)</Label>
          <Input id="r-amount" type="number" step="0.01" {...register("amount")} />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="r-date">Primeira ocorrência</Label>
          <Input id="r-date" type="date" {...register("date")} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Conta</Label>
        <Select value={watch("account_id")} onValueChange={(v) => setValue("account_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(accounts ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Modo de pagamento</Label>
        <Select value={watch("payment_method_id")} onValueChange={(v) => setValue("payment_method_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(paymentMethods ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.payment_method_id && <p className="text-sm text-destructive">{errors.payment_method_id.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <Select value={watch("category_id")} onValueChange={(v) => setValue("category_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(categories ?? []).filter((c) => c.kind === kind).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          Criar recorrência
        </Button>
      </DialogFooter>
    </form>
  );
}

function InstallmentForm({ onDone }: { onDone: () => void }) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: paymentMethods } = usePaymentMethods();
  const createInstallmentPlan = useCreateInstallmentPlan();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof installmentSchema>>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      installments_count: 2,
      date: today(),
      description: "",
      amount: 0,
      account_id: "",
      payment_method_id: "",
      category_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof installmentSchema>) {
    await createInstallmentPlan.mutateAsync({
      description: values.description,
      total_amount_cents: Math.round(values.amount * 100),
      account_id: values.account_id,
      payment_method_id: values.payment_method_id,
      credit_card_id: null,
      category_id: values.category_id,
      installments_count: values.installments_count,
      first_due_date: values.date,
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="i-description">Descrição</Label>
        <Input id="i-description" {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="i-amount">Valor total (R$)</Label>
          <Input id="i-amount" type="number" step="0.01" {...register("amount")} />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="installments_count">Nº de parcelas</Label>
          <Input id="installments_count" type="number" min={2} max={60} {...register("installments_count")} />
          {errors.installments_count && <p className="text-sm text-destructive">{errors.installments_count.message}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="i-date">Vencimento da 1ª parcela</Label>
        <Input id="i-date" type="date" {...register("date")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Conta</Label>
        <Select value={watch("account_id")} onValueChange={(v) => setValue("account_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(accounts ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Modo de pagamento</Label>
        <Select value={watch("payment_method_id")} onValueChange={(v) => setValue("payment_method_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(paymentMethods ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.payment_method_id && <p className="text-sm text-destructive">{errors.payment_method_id.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <Select value={watch("category_id")} onValueChange={(v) => setValue("category_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(categories ?? []).filter((c) => c.kind === "expense").map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          Criar parcelamento
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TransactionFormDialog() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo lançamento</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>Manual, recorrente ou parcelado.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="recurring">Recorrente</TabsTrigger>
            <TabsTrigger value="installment">Parcelado</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <ManualForm onDone={close} />
          </TabsContent>
          <TabsContent value="recurring">
            <RecurringForm onDone={close} />
          </TabsContent>
          <TabsContent value="installment">
            <InstallmentForm onDone={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
