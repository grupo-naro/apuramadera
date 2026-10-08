/**
 * Datos del showroom que se calculan a partir de `store.config.ts`.
 */

/**
 * Número de WhatsApp para mostrar. Reconoce celulares de Buenos Aires
 * (`549` + `11` + 8 dígitos → "11 4445-7240"); cualquier otro formato se
 * muestra como `+<dígitos>`.
 */
export function formatWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const match = digits.match(/^549(11)(\d{4})(\d{4})$/);
  return match ? `${match[1]} ${match[2]}-${match[3]}` : `+${digits}`;
}

/** Link a Google Maps con la dirección (no necesita API key). */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
