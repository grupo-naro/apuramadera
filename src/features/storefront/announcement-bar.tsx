/**
 * Barra de anuncio sobre el header — ofertas, envíos, etc.
 *
 * El contenido sale de `storeConfig.announcement`; si no está
 * definido, no se renderiza nada. No es sticky: se va con el scroll
 * y el header queda fijo arriba.
 */
import Link from "next/link";

import { storeConfig } from "@/store.config";

export function AnnouncementBar() {
  const { announcement } = storeConfig;
  if (!announcement?.text) return null;

  const label = (
    <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em]">
      {announcement.text}
    </span>
  );

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex min-h-9 max-w-6xl items-center justify-center px-4 py-2 text-center sm:px-6">
        {announcement.href ? (
          <Link
            href={announcement.href}
            className="transition-opacity hover:opacity-75"
          >
            {label}
          </Link>
        ) : (
          label
        )}
      </div>
    </div>
  );
}
