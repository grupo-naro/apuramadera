/** Destacados del catálogo real. No se renderiza si el catálogo está vacío. */
import Link from "next/link";

import type { ProductListItem } from "@/core/modules/catalog";
import { ProductCard } from "@/core/ui/commerce";

export function FeaturedProducts({
  products,
}: {
  products: ProductListItem[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Del catálogo
          </span>
          <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
            Destacados
          </h2>
        </div>
        <Link
          href="/productos"
          className="shrink-0 border-b border-foreground/40 pb-0.5 text-xs uppercase tracking-[0.2em] transition-colors hover:border-foreground"
        >
          Ver todo
        </Link>
      </div>

      {/* Un solo producto: una tarjeta centrada, no pegada a la
          izquierda de una grilla de 3-4 columnas. */}
      {products.length === 1 ? (
        <div className="mx-auto mt-10 w-full max-w-xs sm:max-w-sm">
          <ProductCard product={products[0]} priority />
        </div>
      ) : (
        // Mobile: strip horizontal con scroll-snap (sangría a los
        // bordes). `sm` en adelante: la grilla de siempre.
        <div className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="w-[72vw] shrink-0 snap-start sm:w-auto"
            >
              <ProductCard product={product} priority={index < 4} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
