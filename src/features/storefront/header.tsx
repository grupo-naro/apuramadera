/**
 * Header del storefront.
 *
 * La navegación de categorías sale de la base (query chica), así que
 * se renderiza inline — no vale la pena un <Suspense> para streamear
 * un fragmento tan pequeño.
 */
import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { getCategoryTree } from "@/core/modules/catalog";
import { Input } from "@/core/ui/input";
import { CartButton } from "@/features/cart/cart-button";
import { InstagramIcon } from "@/features/storefront/instagram-icon";
import { storeConfig } from "@/store.config";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-6 px-4 sm:px-6">
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
            className="h-10 w-auto mix-blend-multiply"
          />
        </Link>

        <nav className="hidden flex-1 justify-center md:flex">
          <CategoryNav />
        </nav>

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <form action="/productos" className="hidden sm:block">
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

          <CartButton />
        </div>
      </div>
    </header>
  );
}

async function CategoryNav() {
  const tree = await getCategoryTree();

  return (
    <ul className="flex items-center gap-7 text-[0.72rem] font-medium uppercase tracking-[0.18em]">
      <li>
        <Link
          href="/productos"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Todo
        </Link>
      </li>
      {tree.map((category) => (
        <li key={category.id}>
          <Link
            href={`/productos?category=${category.slug}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
