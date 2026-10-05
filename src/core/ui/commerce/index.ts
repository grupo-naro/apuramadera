/**
 * Componentes de commerce del design system.
 *
 * A diferencia de los primitivos de shadcn (`@/core/ui/*`), estos
 * conocen el dominio (productos, precios, variantes). El storefront
 * los compone; todos consumen tokens del theme, nunca valores fijos.
 */
export { Price } from "./price";
export { ProductCard, ProductCardSkeleton } from "./product-card";
export { Breadcrumbs, type BreadcrumbEntry } from "./breadcrumbs";
export { VariantSelector } from "./variant-selector";
