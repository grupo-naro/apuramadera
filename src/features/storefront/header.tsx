/**
 * Header del storefront.
 *
 * La navegación (las primeras categorías + A medida, Showroom y
 * Contacto) sale de una query chica a la base, así que se renderiza
 * inline — no vale la pena un <Suspense> para streamear un fragmento
 * tan pequeño.
 *
 * Celular y tablet (hasta 1024px): logo a la izquierda y, a la derecha,
 * el botón del menú hamburguesa y el ícono de Instagram. Desde 1024px:
 * los links centrados en el header y el buscador.
 * Sin ícono de carrito: el cajón sólo se abre al agregar un producto.
 */
import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { getCategoryTree } from "@/core/modules/catalog";
import { Input } from "@/core/ui/input";
import { InstagramIcon } from "@/features/storefront/instagram-icon";
import { MobileMenu } from "@/features/storefront/mobile-menu";
import { buildNavItems, type NavItem } from "@/features/storefront/nav-items";
import { storeConfig } from "@/store.config";

export async function Header() {
  const items = buildNavItems(await getCategoryTree());

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6 lg:h-20">
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

        {/* Escritorio: los links centrados en el header. */}
        <nav aria-label="Menú principal" className="hidden flex-1 lg:block">
          <NavLinks items={items} />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:ml-0 lg:gap-4">
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

          {/* Celular y tablet: menú hamburguesa (oculto desde lg). */}
          <MobileMenu items={items} />

          {storeConfig.contact.instagram && (
            <a
              href={`https://instagram.com/${storeConfig.contact.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Seguinos en Instagram"
              className="inline-flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <InstagramIcon className="size-5" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLinks({ items }: { items: NavItem[] }) {
  return (
    <ul className="flex items-center justify-center gap-7 text-[0.72rem] font-medium uppercase tracking-[0.18em]">
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
