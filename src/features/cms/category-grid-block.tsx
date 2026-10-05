/**
 * Bloque "Grilla de categorías" — tarjetas de las categorías raíz.
 */
import Link from "next/link";

import { getCategoryTree } from "@/core/modules/catalog";
import type { CategoryGridData } from "@/core/modules/cms";

export async function CategoryGridBlock({
  data,
}: {
  data: CategoryGridData;
}) {
  const categories = await getCategoryTree();
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {data.heading && (
        <h2 className="text-xl font-semibold tracking-tight">
          {data.heading}
        </h2>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/productos?category=${category.slug}`}
            className="group flex aspect-3/2 flex-col items-center justify-center gap-1 rounded-lg border bg-muted/40 p-4 text-center transition-colors hover:border-primary hover:bg-accent"
          >
            <span className="font-semibold tracking-tight">
              {category.name}
            </span>
            {category.description && (
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {category.description}
              </span>
            )}
            <span className="mt-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
              Ver productos →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
