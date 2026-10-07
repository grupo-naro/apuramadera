/**
 * Home editorial de A Pura Madera.
 *
 * Se renderiza cuando el CMS no tiene bloques cargados (ver
 * `app/(storefront)/page.tsx`). Las imágenes de las secciones fijas
 * salen de `public/` (hero + fotos de showroom); los destacados salen
 * del catálogo real y no se muestran si todavía está vacío.
 */
import { listProducts } from "@/core/modules/catalog";

import { CategoryCards } from "./category-cards";
import { CustomFurniture } from "./custom-furniture";
import { EditorialGrid } from "./editorial-grid";
import { FeaturedProducts } from "./featured-products";
import { FEATURED_FETCH_SIZE, selectFeatured } from "./featured-selection";
import { Hero } from "./hero";
import { Manifesto } from "./manifesto";
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
      <CategoryCards />
      <Manifesto />
      {/* La galería de fotos de ilustración sólo se ve con el catálogo
          vacío; con productos, "Destacados" ocupa su lugar. */}
      <EditorialGrid showGallery={featured.length === 0} />
      {featured.length > 0 && <FeaturedProducts products={featured} />}
      <CustomFurniture />
      <ShowroomStrip />
    </>
  );
}
