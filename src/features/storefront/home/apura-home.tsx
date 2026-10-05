/**
 * Home editorial de A Pura Madera.
 *
 * Se renderiza cuando el CMS no tiene bloques cargados (ver
 * `app/(storefront)/page.tsx`). Las imágenes de las secciones fijas
 * salen de `public/` (hero + fotos de showroom); los destacados salen
 * del catálogo real y no se muestran si todavía está vacío.
 */
import { listProducts } from "@/core/modules/catalog";

import { CustomFurniture } from "./custom-furniture";
import { EditorialGrid } from "./editorial-grid";
import { FeaturedProducts } from "./featured-products";
import { Hero } from "./hero";
import { Manifesto } from "./manifesto";
import { ShowroomStrip } from "./showroom-strip";

export async function ApuraHome() {
  const { items } = await listProducts({ pageSize: 8, sort: "newest" });

  return (
    <>
      <Hero />
      <Manifesto />
      <EditorialGrid />
      {items.length > 0 && <FeaturedProducts products={items} />}
      <CustomFurniture />
      <ShowroomStrip />
    </>
  );
}
