import Link from "next/link";

import { cn } from "@/core/lib/utils";
import { buttonVariants } from "@/core/ui/button";

/** Página 404 del storefront. */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        La página que buscás no existe o fue movida.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Volver al inicio
      </Link>
    </main>
  );
}
