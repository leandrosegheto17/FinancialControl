import type { BudgetKind } from "@financial-control/shared";
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

const formSchema = z
  .object({
    category_id: z.string().uuid("Selecione a categoria"),
    limit: z.coerce.number().positive("Informe um valor maior que zero"),
    kind: z.enum(["flexible", "fixed"]),
    description: z.string().optional(),
    due_day: z.coerce.number().int().min(1).max(31).optional(),
  })
  .refine((v) => v.kind === "flexible" || Boolean(v.description?.trim()), {
    message: "Informe uma descrição para a conta fixa",
    path: ["description"],
  })
  .refine((v) => v.kind === "flexible" || Boolean(v.due_day), {
    message: "Informe o dia de vencimento",
    path: ["due_day"],
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
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { category_id: "", limit: 0, kind: "flexible", description: "", due_day: undefined },
  });

  const kind = watch("kind");
  const isFixed = kind === "fixed";

  async function onSubmit(values: FormValues) {
    await createBudget.mutateAsync({
      category_id: values.category_id,
      period_month: periodMonth,
      limit_cents: Math.round(values.limit * 100),
      alert_thresholds: [80, 100],
      kind: values.kind,
      description: isFixed ? (values.description ?? null) : null,
      due_day: isFixed ? (values.due_day ?? null) : null,
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
          <DialogDescription>
            Flexível: teto de gasto com alerta em 80% e 100%. Fixa: conta conhecida (aluguel, assinatura) com
            lembrete de vencimento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setValue("kind", v as BudgetKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">Flexível</SelectItem>
                <SelectItem value="fixed">Fixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isFixed && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" placeholder="Aluguel, Internet, Netflix…" {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Select value={watch("category_id")} onValueChange={(v) => setValue("category_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? [])
                  .filter((c) => c.kind === "expense")
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="limit">{isFixed ? "Valor da conta (R$)" : "Limite mensal (R$)"}</Label>
              <Input id="limit" type="number" step="0.01" {...register("limit")} />
              {errors.limit && <p className="text-sm text-destructive">{errors.limit.message}</p>}
            </div>
            {isFixed && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="due_day">Dia de vencimento</Label>
                <Input id="due_day" type="number" min={1} max={31} {...register("due_day")} />
                {errors.due_day && <p className="text-sm text-destructive">{errors.due_day.message}</p>}
              </div>
            )}
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
