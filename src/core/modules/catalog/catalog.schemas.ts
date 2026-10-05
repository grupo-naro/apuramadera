/**
 * Validación de entrada del catálogo (Zod).
 *
 * Los inputs del listado vienen de los `searchParams` de la URL, así
 * que el schema es TOLERANTE: cada campo usa `.catch()` para caer a
 * un valor por defecto si llega algo inválido. Una URL con basura en
 * los query params nunca debe romper la página — solo ignora el
 * parámetro malo.
 */
import { z } from "zod";

/** Tamaño de página por defecto del listado. */
export const DEFAULT_PAGE_SIZE = 24;

/** Criterios de orden soportados por el listado. */
export const PRODUCT_SORT_VALUES = ["newest", "name"] as const;
export type ProductSort = (typeof PRODUCT_SORT_VALUES)[number];

export const listProductsInputSchema = z.object({
  /** Slug de categoría: filtra esa categoría y todas sus descendientes. */
  category: z.string().trim().min(1).optional().catch(undefined),
  /** Término de búsqueda libre (nombre / descripción). */
  q: z.string().trim().min(1).max(100).optional().catch(undefined),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(60)
    .catch(DEFAULT_PAGE_SIZE),
  sort: z.enum(PRODUCT_SORT_VALUES).catch("newest"),
  /** Si es true, sólo productos con al menos una variante con stock. */
  inStockOnly: z
    .string()
    .optional()
    .transform((v) => v === "true")
    .catch(false),
});

export type ListProductsInput = z.infer<typeof listProductsInputSchema>;
