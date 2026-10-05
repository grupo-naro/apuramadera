/**
 * Configuración de analytics (GA4 + Meta Pixel).
 *
 * Los dos IDs son opcionales e independientes — si no hay env, ese
 * proveedor no se carga ni recibe eventos. Una tienda puede usar GA,
 * Pixel, los dos, o ninguno.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export const hasGA = GA_MEASUREMENT_ID.length > 0;
export const hasPixel = META_PIXEL_ID.length > 0;
