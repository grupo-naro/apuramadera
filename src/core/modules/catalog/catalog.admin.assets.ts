/**
 * Qué assets de Cloudinary se pueden borrar al eliminar un producto.
 *
 * Pura (sin DB): recibe los `publicId` del producto y los que otros
 * productos siguen usando, y devuelve sólo los que quedan huérfanos.
 */

/**
 * - Ignora nulos/vacíos y los assets locales de `public/` (`/…`), que
 *   no viven en Cloudinary.
 * - Quita repetidos y los que otro producto todavía referencia.
 */
export function pickOrphanedAssetIds(
  candidates: ReadonlyArray<string | null | undefined>,
  stillUsed: Iterable<string>,
): string[] {
  const used = new Set(stillUsed);
  const result = new Set<string>();
  for (const candidate of candidates) {
    const id = candidate?.trim();
    if (!id || id.startsWith("/") || used.has(id)) continue;
    result.add(id);
  }
  return [...result];
}
