/**
 * Validación del formulario de producto del panel admin (Zod).
 *
 * Mismo schema en el cliente (React Hook Form) y en el servidor
 * (Server Action). Todos los campos numéricos son strings — es lo
 * que entregan los inputs. Los precios se ingresan en PESOS enteros;
 * la action los convierte a centavos.
 *
 * Un producto puede ser:
 *  · simple   → `hasVariants = false`: precio/stock/sku directos.
 *  · variable → `hasVariants = true`: opciones (Talle, Color…) y una
 *    lista manual de variantes, cada una con su precio/stock/sku.
 *
 * La validación de los campos numéricos es condicional (según
 * `hasVariants`) y se hace en el `superRefine`.
 */
import { z } from "zod";

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Publicado",
  ARCHIVED: "Archivado",
};

/** Máximo de ejes de variación (Talle, Color, …) por producto. */
export const MAX_OPTIONS = 3;

const isInt = (value: string) => /^\d+$/.test(value);
const isOptionalInt = (value: string) => value === "" || /^\d+$/.test(value);

const optionSchema = z.object({
  name: z.string().trim().min(1, "Nombrá la opción").max(50),
});

const variantSchema = z.object({
  /** Un valor por opción, en el orden de `options`. */
  values: z.array(z.string().trim().max(50)),
  sku: z.string().trim().max(100),
  price: z.string().trim(),
  compareAtPrice: z.string().trim(),
  stock: z.string().trim(),
  isActive: z.boolean(),
});

const imageSchema = z.object({
  /** public_id del asset en Cloudinary. */
  publicId: z.string().min(1),
  alt: z.string().trim().max(200),
});

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ingresá el nombre")
      .max(200, "Máximo 200 caracteres"),
    slug: z
      .string()
      .trim()
      .min(1, "Ingresá el slug")
      .max(200)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Sólo minúsculas, números y guiones",
      ),
    description: z.string().trim().max(5000),
    status: z.enum(PRODUCT_STATUSES),
    metaTitle: z.string().trim().max(200),
    metaDescription: z.string().trim().max(300),
    categoryIds: z.array(z.string()),
    images: z.array(imageSchema),
    // Modelo 3D para la vista AR de la PDP. `publicId` del asset `raw`
    // en Cloudinary. El `.usdz` (iOS) se genera desde el `.glb` al
    // subirlo; ambos vacíos ⇒ el producto no muestra AR. Como el resto
    // de los campos opcionales del form, viajan siempre como string
    // (`""` = sin modelo), no como opcionales.
    modelGlbPublicId: z.string().trim().max(300),
    modelUsdzPublicId: z.string().trim().max(300),
    hasVariants: z.boolean(),
    // ── Producto simple (validado sólo si !hasVariants) ──
    sku: z.string().trim().max(100),
    price: z.string().trim(),
    compareAtPrice: z.string().trim(),
    stock: z.string().trim(),
    // ── Producto variable (validado sólo si hasVariants) ──
    options: z.array(optionSchema).max(MAX_OPTIONS),
    variants: z.array(variantSchema),
  })
  .superRefine((data, ctx) => {
    if (!data.hasVariants) {
      if (!isInt(data.price)) {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Ingresá pesos enteros",
        });
      }
      if (!isInt(data.stock)) {
        ctx.addIssue({
          code: "custom",
          path: ["stock"],
          message: "Ingresá un número entero",
        });
      }
      if (!isOptionalInt(data.compareAtPrice)) {
        ctx.addIssue({
          code: "custom",
          path: ["compareAtPrice"],
          message: "Ingresá pesos enteros",
        });
      } else if (
        data.compareAtPrice !== "" &&
        Number(data.compareAtPrice) <= Number(data.price)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["compareAtPrice"],
          message: "Debe ser mayor al precio",
        });
      }
      return;
    }

    // hasVariants
    if (data.options.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Agregá al menos una opción",
      });
    }
    const lowerNames = data.options.map((o) => o.name.trim().toLowerCase());
    lowerNames.forEach((name, index) => {
      if (name && lowerNames.indexOf(name) !== index) {
        ctx.addIssue({
          code: "custom",
          path: ["options", index, "name"],
          message: "Opción repetida",
        });
      }
    });

    if (data.variants.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Agregá al menos una variante",
      });
    }

    const seenCombos = new Set<string>();
    data.variants.forEach((variant, vIndex) => {
      data.options.forEach((_, oIndex) => {
        if (!variant.values[oIndex]?.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["variants", vIndex, "values", oIndex],
            message: "Elegí un valor",
          });
        }
      });
      if (!isInt(variant.price)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", vIndex, "price"],
          message: "Pesos enteros",
        });
      }
      if (!isInt(variant.stock)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", vIndex, "stock"],
          message: "Número entero",
        });
      }
      if (!isOptionalInt(variant.compareAtPrice)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", vIndex, "compareAtPrice"],
          message: "Pesos enteros",
        });
      } else if (
        variant.compareAtPrice !== "" &&
        Number(variant.compareAtPrice) <= Number(variant.price)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", vIndex, "compareAtPrice"],
          message: "Debe ser mayor al precio",
        });
      }
      const combo = data.options
        .map((_, oIndex) => (variant.values[oIndex] ?? "").trim().toLowerCase())
        .join("");
      if (seenCombos.has(combo)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", vIndex, "values", 0],
          message: "Combinación repetida",
        });
      } else {
        seenCombos.add(combo);
      }
    });
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;
export type VariantFormInput = z.infer<typeof variantSchema>;

// ─── Categorías (M3.4) ─────────────────────────────────────────

/** Valor del select de padre cuando la categoría es raíz. */
export const NO_PARENT = "none";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre")
    .max(100, "Máximo 100 caracteres"),
  slug: z
    .string()
    .trim()
    .min(1, "Ingresá el slug")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Sólo minúsculas, números y guiones",
    ),
  description: z.string().trim().max(2000),
  /** Id de la categoría padre, o `NO_PARENT` si es raíz. */
  parentId: z.string(),
  sortOrder: z
    .string()
    .trim()
    .min(1, "Requerido")
    .regex(/^\d+$/, "Ingresá un número entero"),
  isActive: z.boolean(),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
