"use server";

/**
 * Server Actions del catálogo (panel admin).
 *
 * Las actions devuelven un resultado (no redirigen): el componente
 * cliente decide la navegación. El input del formulario se normaliza
 * al modelo unificado `optionNames` + `variants` (el producto simple
 * es 0 opciones y 1 variante). Los precios entran en pesos y se
 * guardan en centavos.
 */
import { revalidatePath } from "next/cache";

import {
  createProduct,
  deleteProduct,
  updateProduct,
  type SaveProductData,
} from "./catalog.admin.repository";
import { productFormSchema, type ProductFormInput } from "./catalog.admin.schemas";

export type SaveProductResult =
  | { ok: true }
  | { ok: false; error: string; field?: "slug" | "sku" };

/** Pesos (string) → centavos. */
const toCentavos = (pesos: string) => Number(pesos) * 100;

/** Normaliza el input del formulario al modelo del repositorio. */
function toSaveData(input: ProductFormInput): SaveProductData {
  const base = {
    name: input.name,
    slug: input.slug,
    description: input.description.trim() || null,
    status: input.status,
    metaTitle: input.metaTitle.trim() || null,
    metaDescription: input.metaDescription.trim() || null,
    modelGlbPublicId: input.modelGlbPublicId.trim() || null,
    modelUsdzPublicId: input.modelUsdzPublicId.trim() || null,
    categoryIds: input.categoryIds,
    images: input.images.map((image) => ({
      publicId: image.publicId,
      alt: image.alt.trim() || null,
    })),
  };

  if (!input.hasVariants) {
    return {
      ...base,
      optionNames: [],
      variants: [
        {
          values: [],
          sku: input.sku.trim() || null,
          price: toCentavos(input.price),
          compareAtPrice:
            input.compareAtPrice !== ""
              ? toCentavos(input.compareAtPrice)
              : null,
          stock: Number(input.stock),
          isActive: true,
        },
      ],
    };
  }

  const optionNames = input.options.map((option) => option.name.trim());
  return {
    ...base,
    optionNames,
    variants: input.variants.map((variant) => ({
      values: variant.values
        .slice(0, optionNames.length)
        .map((value) => value.trim()),
      sku: variant.sku.trim() || null,
      price: toCentavos(variant.price),
      compareAtPrice:
        variant.compareAtPrice !== ""
          ? toCentavos(variant.compareAtPrice)
          : null,
      stock: Number(variant.stock),
      isActive: variant.isActive,
    })),
  };
}

/** Detecta una violación de unicidad (P2002) y a qué campo afecta. */
function uniqueViolationField(error: unknown): "slug" | "sku" | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    (error as { code: unknown }).code !== "P2002"
  ) {
    return null;
  }
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  const fields = (Array.isArray(target) ? target : [target]).map(String);
  if (fields.some((f) => f.includes("sku"))) return "sku";
  return "slug";
}

export async function saveProduct(
  productId: string | null,
  input: unknown,
): Promise<SaveProductResult> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del formulario." };
  }
  const data = toSaveData(parsed.data);

  try {
    if (productId) {
      await updateProduct(productId, data);
    } else {
      await createProduct(data);
    }
  } catch (error) {
    const field = uniqueViolationField(error);
    if (field === "slug") {
      return { ok: false, error: "Ya existe un producto con ese slug.", field };
    }
    if (field === "sku") {
      return {
        ok: false,
        error: "Hay un SKU repetido — cada variante necesita uno único.",
        field,
      };
    }
    throw error;
  }

  revalidatePath("/admin/productos");
  // La home muestra "Destacados": que se actualice sin esperar la hora de ISR.
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProductAction(
  productId: string,
): Promise<{ ok: true }> {
  await deleteProduct(productId);
  revalidatePath("/admin/productos");
  revalidatePath("/");
  return { ok: true };
}
