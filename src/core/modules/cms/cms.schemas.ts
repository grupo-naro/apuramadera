/**
 * Registro de tipos de bloque de la home (CMS · M5.1).
 *
 * Cada tipo define un schema Zod para su `data`. `HOME_BLOCK_SCHEMAS`
 * es el registro: agregar un tipo nuevo = sumar su schema acá (y su
 * renderer en `features/cms`). El mismo schema valida la `data`
 * guardada y, en M5.2, el formulario del editor.
 */
import { z } from "zod";

export const HOME_BLOCK_TYPES = [
  "HERO_BANNER",
  "PRODUCT_CAROUSEL",
  "CATEGORY_GRID",
] as const;

export type HomeBlockType = (typeof HOME_BLOCK_TYPES)[number];

export const HOME_BLOCK_TYPE_LABELS: Record<HomeBlockType, string> = {
  HERO_BANNER: "Banner principal",
  PRODUCT_CAROUSEL: "Carrusel de productos",
  CATEGORY_GRID: "Grilla de categorías",
};

/** Banner principal — imagen a pantalla completa con título y CTA. */
export const heroBannerSchema = z.object({
  imagePublicId: z.string().min(1),
  imageAlt: z.string().default(""),
  heading: z.string().min(1),
  subheading: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaHref: z.string().default(""),
});

/** Carrusel de productos — de una categoría, o los más nuevos. */
export const productCarouselSchema = z.object({
  heading: z.string().default(""),
  /** Slug de categoría; vacío ⇒ productos más nuevos. */
  categorySlug: z.string().default(""),
  limit: z.number().int().min(1).max(20).default(8),
});

/** Grilla de categorías — muestra las categorías raíz. */
export const categoryGridSchema = z.object({
  heading: z.string().default(""),
});

/** Registro tipo → schema de su `data`. */
export const HOME_BLOCK_SCHEMAS = {
  HERO_BANNER: heroBannerSchema,
  PRODUCT_CAROUSEL: productCarouselSchema,
  CATEGORY_GRID: categoryGridSchema,
} as const;

export type HeroBannerData = z.infer<typeof heroBannerSchema>;
export type ProductCarouselData = z.infer<typeof productCarouselSchema>;
export type CategoryGridData = z.infer<typeof categoryGridSchema>;

// ─── Schemas del formulario del editor (M5.2) ──────────────────
//
// Los 3 schemas comparten EXACTAMENTE las mismas claves (todas string
// salvo `isActive`) — sólo cambia qué campos validan en serio. Así
// `z.infer` de cualquiera da el mismo `BlockFormValues` y un único
// `<BlockForm>` con React Hook Form sirve para los 3 tipos.

/** Formato `<input type="datetime-local">` o vacío — se interpreta UTC. */
const datetimeLocalOrEmpty = z
  .string()
  .refine(
    (value) =>
      value === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value),
    "Fecha inválida",
  );

const blockFormFields = {
  isActive: z.boolean(),
  heading: z.string().trim().max(120),
  imagePublicId: z.string().trim(),
  imageAlt: z.string().trim().max(200),
  subheading: z.string().trim().max(200),
  ctaLabel: z.string().trim().max(40),
  ctaHref: z.string().trim().max(200),
  categorySlug: z.string().trim(),
  limit: z.string().trim(),
  /** Ventana de visibilidad (UTC). Vacío = sin límite. M5.3. */
  startsAt: datetimeLocalOrEmpty,
  endsAt: datetimeLocalOrEmpty,
};

export const heroBannerFormSchema = z.object({
  ...blockFormFields,
  imagePublicId: z.string().trim().min(1, "Subí una imagen"),
  heading: z.string().trim().min(1, "Ingresá el título").max(120),
});

export const productCarouselFormSchema = z.object({
  ...blockFormFields,
  limit: z
    .string()
    .trim()
    .regex(/^([1-9]|1[0-9]|20)$/, "Un número del 1 al 20"),
});

export const categoryGridFormSchema = z.object(blockFormFields);

/** Registro tipo → schema del formulario. */
export const HOME_BLOCK_FORM_SCHEMAS = {
  HERO_BANNER: heroBannerFormSchema,
  PRODUCT_CAROUSEL: productCarouselFormSchema,
  CATEGORY_GRID: categoryGridFormSchema,
} as const;

/** Valores del formulario del editor — mismos campos para los 3 tipos. */
export type BlockFormValues = z.infer<typeof categoryGridFormSchema>;

/**
 * Centinela del select de categoría del carrusel — representa "más
 * nuevos / todas" en el formulario. Radix Select no acepta `value=""`,
 * así que en la `data` guardada esto se traduce a `""`.
 */
export const CAROUSEL_NEWEST_VALUE = "__newest__";
