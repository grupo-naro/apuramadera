"use client";

/**
 * Fila del listado del editor de bloques — toggle de activo, reordenar
 * (intercambio con el vecino), editar y borrar.
 */
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import {
  deleteBlockAction,
  moveBlockAction,
  toggleBlockActiveAction,
} from "@/core/modules/cms/cms.actions";
import { HOME_BLOCK_TYPE_LABELS } from "@/core/modules/cms/cms.schemas";
import type { HomeBlockListItem } from "@/core/modules/cms/cms.types";
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
import { Button, buttonVariants } from "@/core/ui/button";
import { Switch } from "@/core/ui/switch";

interface BlockRowProps {
  block: HomeBlockListItem;
  isFirst: boolean;
  isLast: boolean;
}

export function BlockRow({ block, isFirst, isLast }: BlockRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function runAction(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {HOME_BLOCK_TYPE_LABELS[block.type]}
        </span>
        <span className="truncate text-sm font-medium">{block.summary}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Switch
          checked={block.isActive}
          disabled={pending}
          onCheckedChange={(checked) =>
            runAction(() => toggleBlockActiveAction(block.id, checked))
          }
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Subir bloque"
          disabled={pending || isFirst}
          onClick={() => runAction(() => moveBlockAction(block.id, "up"))}
        >
          <ArrowUpIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Bajar bloque"
          disabled={pending || isLast}
          onClick={() => runAction(() => moveBlockAction(block.id, "down"))}
        >
          <ArrowDownIcon className="size-4" />
        </Button>
        <Link
          href={`/admin/contenido/${block.id}`}
          aria-label="Editar bloque"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <PencilIcon className="size-4" />
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar bloque"
              disabled={pending}
            >
              <Trash2Icon className="size-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este bloque?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El bloque deja de mostrarse
                en la home apenas se elimine.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => runAction(() => deleteBlockAction(block.id))}
                disabled={pending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
