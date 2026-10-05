"use client";

/**
 * Botón "Eliminar producto" con confirmación (AlertDialog).
 * Tras borrar, redirige al listado.
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { deleteProductAction } from "@/core/modules/catalog/catalog.admin.actions";
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

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      await deleteProductAction(productId);
      router.push("/admin/productos");
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
          <AlertDialogTitle>¿Eliminar “{productName}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer: se elimina el producto y sus
            variantes. Las órdenes ya realizadas conservan sus datos.
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
