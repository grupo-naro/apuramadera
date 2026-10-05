/**
 * Formato de moneda.
 *
 * El dinero se guarda en centavos (Int). Estas funciones lo pasan a
 * texto legible. Los defaults son Argentina; en la Fase 4 el locale
 * y la moneda van a venir de `store.config.ts`.
 */

const DEFAULT_LOCALE = "es-AR";
const DEFAULT_CURRENCY = "ARS";

export interface MoneyFormatOptions {
  locale?: string;
  currency?: string;
}

// Crear un Intl.NumberFormat no es gratis: lo cacheamos por
// combinación locale+currency (un listado formatea decenas de precios).
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/** Formatea centavos como precio. `1599900` → `"$ 15.999,00"`. */
export function formatPrice(
  centavos: number,
  options: MoneyFormatOptions = {},
): string {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const currency = options.currency ?? DEFAULT_CURRENCY;
  return getFormatter(locale, currency).format(centavos / 100);
}

/**
 * Formatea un rango de precios. Si mínimo y máximo coinciden devuelve
 * un solo precio; si no, `"$ X – $ Y"` (productos con variantes de
 * distinto precio).
 */
export function formatPriceRange(
  min: number,
  max: number,
  options: MoneyFormatOptions = {},
): string {
  if (min === max) return formatPrice(min, options);
  return `${formatPrice(min, options)} – ${formatPrice(max, options)}`;
}

/**
 * Porcentaje de descuento entre un precio y su precio anterior.
 * `discountPercent(15999_00, 19999_00)` → `20`. `null` si no hay
 * descuento válido.
 */
export function discountPercent(
  price: number,
  compareAtPrice: number | null | undefined,
): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}
