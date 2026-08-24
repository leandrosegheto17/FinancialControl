import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useDeleteCategory } from "../hooks/useCategories";
import { CategoryFormDialog } from "./CategoryFormDialog";

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <CategoryFormDialog />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories ?? []).map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.kind === "income" ? "Receita" : "Despesa"}</TableCell>
                <TableCell>
                  <Badge variant={category.is_system_default ? "secondary" : "outline"}>
                    {category.is_system_default ? "Padrão do sistema" : "Personalizada"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!category.is_system_default && (
                    <button
                      type="button"
                      onClick={() => deleteCategory.mutate(category.id)}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Excluir
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
