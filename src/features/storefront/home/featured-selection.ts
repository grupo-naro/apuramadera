/**
 * Cuántos productos muestra "Destacados" en la home.
 *
 * `items` son los más nuevos (como mucho `FEATURED_FETCH_SIZE`) y
 * `total` es el tamaño del catálogo activo. Con más de
 * `FEATURED_FETCH_SIZE` productos se muestran sólo los primeros
 * `FEATURED_WHEN_MANY`; el resto se ve en el catálogo ("Ver todo").
 */
export const FEATURED_FETCH_SIZE = 8;
export const FEATURED_WHEN_MANY = 4;

export function selectFeatured<T>(items: T[], total: number): T[] {
  return total > FEATURED_FETCH_SIZE ? items.slice(0, FEATURED_WHEN_MANY) : items;
}
