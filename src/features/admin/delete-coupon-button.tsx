"use client";

/**
 * Botón "Eliminar cupón" con confirmación (AlertDialog).
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { deleteCouponAction } from "@/core/modules/coupons/coupons.actions";
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

interface DeleteCouponButtonProps {
  couponId: string;
  couponCode: string;
}

export function DeleteCouponButton({
  couponId,
  couponCode,
}: DeleteCouponButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      await deleteCouponAction(couponId);
      router.push("/admin/cupones");
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
          <AlertDialogTitle>¿Eliminar el cupón {couponCode}?</AlertDialogTitle>
          <AlertDialogDescription>
            Las órdenes anteriores conservan su snapshot, pero el código deja de
            poder aplicarse en futuras compras.
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
