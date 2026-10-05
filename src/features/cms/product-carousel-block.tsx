/**
 * Bloque "Carrusel de productos" — fila horizontal scrolleable de
 * productos, de una categoría o los más nuevos.
 */
import { listProducts } from "@/core/modules/catalog";
import type { ProductCarouselData } from "@/core/modules/cms";
import { ProductCard } from "@/core/ui/commerce";

export async function ProductCarouselBlock({
  data,
}: {
  data: ProductCarouselData;
}) {
  const result = await listProducts({
    category: data.categorySlug || undefined,
    pageSize: data.limit,
    sort: "newest",
  });

  if (result.items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {data.heading && (
        <h2 className="text-xl font-semibold tracking-tight">
          {data.heading}
        </h2>
      )}
      <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-3">
        {result.items.map((product) => (
          <div
            key={product.id}
            className="w-40 shrink-0 snap-start sm:w-48"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
