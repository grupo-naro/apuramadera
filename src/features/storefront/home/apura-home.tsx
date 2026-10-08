/**
 * Home editorial de A Pura Madera.
 *
 * Se renderiza cuando el CMS no tiene bloques cargados (ver
 * `app/(storefront)/page.tsx`). Las imágenes de las secciones fijas
 * salen de `public/`; los destacados salen del catálogo real y no se
 * muestran si todavía está vacío.
 *
 * Orden: hero → franja de cualidades → tarjetas → calidad artesanal →
 * destacados → showroom. "A medida" no tiene sección en la home: se
 * llega desde el menú del header (`/muebles-a-medida`).
 */
import { listProducts } from "@/core/modules/catalog";

import { CategoryCards } from "./category-cards";
import { CraftQuality } from "./craft-quality";
import { FeaturedProducts } from "./featured-products";
import { FEATURED_FETCH_SIZE, selectFeatured } from "./featured-selection";
import { Hero } from "./hero";
import { QualityStrip } from "./quality-strip";
import { ShowroomStrip } from "./showroom-strip";

export async function ApuraHome() {
  const { items, total } = await listProducts({
    pageSize: FEATURED_FETCH_SIZE,
    sort: "newest",
  });
  const featured = selectFeatured(items, total);

  return (
    <>
      <Hero />
      <QualityStrip />
      <CategoryCards />
      <CraftQuality />
      {featured.length > 0 && <FeaturedProducts products={featured} />}
      <ShowroomStrip />
    </>
  );
}
