/**
 * Header del storefront.
 *
 * La navegación (las primeras categorías + A medida, Showroom y
 * Contacto) sale de una query chica a la base, así que se renderiza
 * inline — no vale la pena un <Suspense> para streamear un fragmento
 * tan pequeño. El menú comparte fila con el logo en todos los tamaños.
 * Sin ícono de carrito: el cajón sólo se abre al agregar un producto.
 */
import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { getCategoryTree } from "@/core/modules/catalog";
import { Input } from "@/core/ui/input";
import { InstagramIcon } from "@/features/storefront/instagram-icon";
import { buildNavItems, type NavItem } from "@/features/storefront/nav-items";
import { storeConfig } from "@/store.config";

export async function Header() {
  const items = buildNavItems(await getCategoryTree());

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 py-2 sm:gap-6 sm:px-6 lg:h-20 lg:py-0">
        <Link
          href="/"
          aria-label={`${storeConfig.name} — inicio`}
          className="shrink-0"
        >
          {/* El PNG es negro sobre blanco: `mix-blend-multiply` funde
              el blanco con el hueso del fondo. */}
          <Image
            src="/logo.png"
            alt={storeConfig.name}
            width={132}
            height={66}
            priority
            className="h-8 w-auto mix-blend-multiply lg:h-10"
          />
        </Link>

        {/* Un solo menú, en la misma fila que el logo: a la derecha y
            en dos renglones si hace falta en celular; centrado en
            escritorio. */}
        <nav aria-label="Menú principal" className="flex-1">
          <NavLinks
            items={items}
            className="flex-wrap justify-end gap-x-3 gap-y-0.5 text-[0.55rem] tracking-[0.04em] sm:gap-x-5 sm:text-[0.68rem] sm:tracking-[0.14em] lg:justify-center lg:gap-7 lg:text-[0.72rem] lg:tracking-[0.18em]"
          />
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          <form action="/productos" className="hidden lg:block">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                type="search"
                placeholder="Buscar"
                aria-label="Buscar productos"
                className="w-36 rounded-none border-0 border-b border-border bg-transparent pl-6 text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0 lg:w-48"
              />
            </div>
          </form>

          {storeConfig.contact.instagram && (
            <a
              href={`https://instagram.com/${storeConfig.contact.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Seguinos en Instagram"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <InstagramIcon className="size-5" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLinks({
  items,
  className,
}: {
  items: NavItem[];
  className: string;
}) {
  return (
    <ul
      className={`flex items-center font-medium uppercase ${className}`}
    >
      {items.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
