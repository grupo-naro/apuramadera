"use client";

/**
 * Barra superior del panel en pantallas chicas: marca + botón que
 * abre la navegación en un drawer (Sheet). En escritorio el sidebar
 * fijo la reemplaza (este componente va oculto en `lg`).
 */
import { useState } from "react";
import { LogOutIcon, MenuIcon } from "lucide-react";

// Import directo del archivo `"use server"` — NO del barrel `@/core/auth`,
// que arrastraría `auth.ts` (Prisma) al bundle del cliente.
import { signOutAction } from "@/core/auth/auth.actions";
import { Button } from "@/core/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/ui/sheet";
import { storeConfig } from "@/store.config";

import { AdminNav } from "./admin-nav";

interface AdminMobileHeaderProps {
  userEmail?: string | null;
}

export function AdminMobileHeader({ userEmail }: AdminMobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Abrir menú">
            <MenuIcon className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Panel de la tienda</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3">
            <AdminNav onNavigate={() => setOpen(false)} />
          </div>

          <div className="border-t p-3">
            {userEmail && (
              <p
                className="truncate px-3 text-xs text-muted-foreground"
                title={userEmail}
              >
                {userEmail}
              </p>
            )}
            <form action={signOutAction} className="mt-2">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3"
              >
                <LogOutIcon className="size-4" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <span className="font-bold tracking-tight">{storeConfig.shortName}</span>
    </header>
  );
}
