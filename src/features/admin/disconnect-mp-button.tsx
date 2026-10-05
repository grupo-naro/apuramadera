"use client";

/**
 * Botón "Desconectar Mercado Pago" con confirmación.
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon } from "lucide-react";

import { disconnectMercadoPagoAction } from "@/core/modules/payments/payments.actions";
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

export function DisconnectMpButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      await disconnectMercadoPagoAction();
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LinkIcon className="size-4" />
          Desconectar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desconectar Mercado Pago?</AlertDialogTitle>
          <AlertDialogDescription>
            La tienda dejará de poder cobrar hasta que vuelvas a conectar una
            cuenta. Las órdenes ya hechas no se afectan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "Desconectando…" : "Desconectar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
