/**
 * Utilidades de SEO: URL del sitio y constructores de JSON-LD.
 *
 * El JSON-LD le describe el contenido a buscadores y a IAs. Se
 * renderiza con el componente `<JsonLd>` (core/ui/json-ld).
 */
import { buildCloudinaryUrl } from "@/core/integrations/cloudinary";
import type { ProductDetail } from "@/core/modules/catalog";

/** URL pública del sitio, sin barra final. En F4 viene de store.config. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Convierte una ruta relativa en URL absoluta. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// En F4 la moneda saldrá de store.config.ts.
const CURRENCY = "ARS";

/** Imagen de producto en tamaño grande — para OG y JSON-LD. */
export function productOgImage(publicId: string): string {
  return buildCloudinaryUrl(publicId, {
    width: 1200,
    crop: "fill",
    aspectRatio: "1:1",
  });
}

/** JSON-LD schema.org/Product para la página de detalle. */
export function productJsonLd(product: ProductDetail) {
  const prices = product.variants.map((v) => v.price / 100);
  const url = absoluteUrl(`/productos/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((image) => productOgImage(image.publicId)),
    sku: product.variants[0]?.sku ?? undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: CURRENCY,
      lowPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highPrice: prices.length > 0 ? Math.max(...prices) : 0,
      offerCount: product.variants.length,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url,
    },
  };
}

/** JSON-LD schema.org/BreadcrumbList. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
