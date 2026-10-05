"use client";

/**
 * Botón "Eliminar categoría" con confirmación (AlertDialog).
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { deleteCategoryAction } from "@/core/modules/catalog/catalog.admin.categories.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/ui/alert-dialog";
import { Button } from "@/core/ui/button";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      await deleteCategoryAction(categoryId);
      router.push("/admin/categorias");
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-destructive">
          <Trash2Icon className="size-4" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar “{categoryName}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Las subcategorías pasan a ser categorías raíz y los productos
            pierden este vínculo (no se eliminan).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
