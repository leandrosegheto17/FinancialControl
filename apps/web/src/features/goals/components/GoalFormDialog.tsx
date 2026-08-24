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
import { useCreateGoal } from "../hooks/useGoals";

const formSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  target: z.coerce.number().positive("Informe um valor maior que zero"),
  target_date: z.string().optional(),
  linked_account_id: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function GoalFormDialog() {
  const [open, setOpen] = useState(false);
  const { data: accounts } = useAccounts();
  const createGoal = useCreateGoal();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { name: "", target: 0, target_date: "", linked_account_id: "" } });

  async function onSubmit(values: FormValues) {
    await createGoal.mutateAsync({
      name: values.name,
      target_amount_cents: Math.round(values.target * 100),
      target_date: values.target_date || null,
      linked_account_id: values.linked_account_id || null,
      icon: null,
      color: null,
      current_amount_cents: 0,
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova meta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
          <DialogDescription>Vincule a uma conta para progresso automático, ou acompanhe manualmente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="target">Valor alvo (R$)</Label>
              <Input id="target" type="number" step="0.01" {...register("target")} />
              {errors.target && <p className="text-sm text-destructive">{errors.target.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="target_date">Data alvo (opcional)</Label>
              <Input id="target_date" type="date" {...register("target_date")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Conta vinculada (opcional)</Label>
            <Select value={watch("linked_account_id")} onValueChange={(v) => setValue("linked_account_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Progresso manual" />
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
