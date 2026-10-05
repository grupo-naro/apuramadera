import type { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/core/lib/utils";
import { getCategoryBySlug, listProducts } from "@/core/modules/catalog";
import { buttonVariants } from "@/core/ui/button";
import { Breadcrumbs, ProductCard } from "@/core/ui/commerce";
import { ProductSort } from "@/features/storefront/product-sort";

type SearchParams = Record<string, string | string[] | undefined>;

/** Construye una URL de /productos preservando los filtros actuales. */
function buildQuery(
  base: SearchParams,
  overrides: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (typeof value === "string" && value) params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/productos?${qs}` : "/productos";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;
  const query = typeof sp.q === "string" ? sp.q : undefined;

  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug);
    if (category) {
      return {
        title: category.name,
        description: `Comprá ${category.name} en nuestra tienda online.`,
        alternates: { canonical: `/productos?category=${category.slug}` },
      };
    }
  }
  if (query) {
    return { title: `Búsqueda: ${query}`, robots: { index: false } };
  }
  return {
    title: "Productos",
    description: "Explorá todo el catálogo de la tienda.",
    alternates: { canonical: "/productos" },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const result = await listProducts(sp);

  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;
  const query = typeof sp.q === "string" ? sp.q : undefined;
  const sortValue = typeof sp.sort === "string" ? sp.sort : "newest";
  const category = categorySlug ? await getCategoryBySlug(categorySlug) : null;

  const heading = category
    ? category.name
    : query
      ? `Resultados para «${query}»`
      : "Todos los productos";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {category && (
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: "Inicio", href: "/" },
            { label: "Productos", href: "/productos" },
            ...category.breadcrumb.map((c) => ({
              label: c.name,
              href: `/productos?category=${c.slug}`,
            })),
          ]}
        />
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Catálogo
          </span>
          <h1 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "producto" : "productos"}
          </p>
        </div>
        <ProductSort value={sortValue} />
      </div>

      {category && category.children.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/productos?category=${child.slug}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {result.items.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <p className="font-serif text-2xl tracking-tight">
            No encontramos productos
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Probá quitar filtros o buscar otra cosa.
          </p>
          <Link
            href="/productos"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Ver todos los productos
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {result.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>

          {result.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-3">
              {result.page > 1 ? (
                <Link
                  href={buildQuery(sp, { page: result.page - 1 })}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Anterior
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "pointer-events-none opacity-50",
                  )}
                >
                  Anterior
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Página {result.page} de {result.totalPages}
              </span>
              {result.page < result.totalPages ? (
                <Link
                  href={buildQuery(sp, { page: result.page + 1 })}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Siguiente
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "pointer-events-none opacity-50",
                  )}
                >
                  Siguiente
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
