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
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreateBudget } from "../hooks/useBudgets";

const formSchema = z.object({
  category_id: z.string().uuid("Selecione a categoria"),
  limit: z.coerce.number().positive("Informe um limite maior que zero"),
});
type FormValues = z.infer<typeof formSchema>;

export function BudgetFormDialog({ periodMonth }: { periodMonth: string }) {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { category_id: "", limit: 0 } });

  async function onSubmit(values: FormValues) {
    await createBudget.mutateAsync({
      category_id: values.category_id,
      period_month: periodMonth,
      limit_cents: Math.round(values.limit * 100),
      alert_thresholds: [80, 100],
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo orçamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo orçamento</DialogTitle>
          <DialogDescription>Alerta automático em 80% e 100% do limite.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limit">Limite mensal (R$)</Label>
            <Input id="limit" type="number" step="0.01" {...register("limit")} />
            {errors.limit && <p className="text-sm text-destructive">{errors.limit.message}</p>}
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
