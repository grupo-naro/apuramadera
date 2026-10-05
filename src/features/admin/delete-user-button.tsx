"use client";

/**
 * Botón "Eliminar usuario" con confirmación (AlertDialog).
 */
import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";

import { deleteUserAction } from "@/core/modules/users/users.actions";
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

interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
}

export function DeleteUserButton({ userId, userEmail }: DeleteUserButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-destructive">
            <Trash2Icon className="size-4" />
            Eliminar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {userEmail}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pierde el acceso al panel de inmediato.
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
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </>
  );
}
