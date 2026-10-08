"use client";

/**
 * Menú hamburguesa del header (celular y tablet, hasta 1024px): un
 * botón que abre un panel lateral con los mismos links del menú de
 * escritorio. Al tocar un link se cierra el panel.
 */
import Link from "next/link";
import { useState } from "react";
import { MenuIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/ui/sheet";

import type { NavItem } from "./nav-items";

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menú"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent lg:hidden"
        >
          <MenuIcon className="size-6" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-4/5 max-w-xs gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Menú</SheetTitle>
          <SheetDescription className="sr-only">
            Navegación principal de la tienda
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Menú principal">
          <ul className="flex flex-col py-2">
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-6 py-4 text-sm font-medium uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
