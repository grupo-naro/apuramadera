/**
 * Módulo Catálogo — API pública.
 *
 * El resto de la app importa SIEMPRE desde acá (`@/core/modules/catalog`),
 * nunca de los archivos internos del módulo. Eso mantiene el límite del
 * módulo: el repositorio y los mappers quedan encapsulados.
 *
 * Fase 1 · M1.2 — capa de datos y use cases del catálogo.
 */

// Use cases (lo que consume el storefront).
export {
  getProductBySlug,
  listProducts,
  getCategoryTree,
  getCategoryBySlug,
  listProductSlugs,
} from "./catalog.use-cases";

// Tipos de dominio.
export type {
  Category,
  CategorySummary,
  CategoryTreeNode,
  CategoryDetail,
  ProductImage,
  PriceRange,
  ProductListItem,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductDetail,
  ProductListResult,
} from "./catalog.types";

// Schema y tipos de input — el storefront los usa para tipar searchParams.
export {
  listProductsInputSchema,
  PRODUCT_SORT_VALUES,
  DEFAULT_PAGE_SIZE,
  type ListProductsInput,
  type ProductSort,
} from "./catalog.schemas";
