"use server";

/**
 * Server Actions de categorías (panel admin).
 *
 * Devuelven un resultado (no redirigen): el componente cliente
 * decide la navegación. Al guardar se revalida el panel y el
 * storefront (la navegación de categorías vive en su layout).
 */
import { revalidatePath } from "next/cache";

import {
  createCategory,
  deleteCategory,
  updateCategory,
  type SaveCategoryData,
} from "./catalog.admin.categories.repository";
import {
  categoryFormSchema,
  NO_PARENT,
  type CategoryFormInput,
} from "./catalog.admin.schemas";

export type SaveCategoryResult =
  | { ok: true }
  | { ok: false; error: string; field?: "slug" };

function toSaveData(input: CategoryFormInput): SaveCategoryData {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description.trim() || null,
    parentId: input.parentId === NO_PARENT ? null : input.parentId,
    sortOrder: Number(input.sortOrder),
    isActive: input.isActive,
  };
}

function isUniqueSlugError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

function revalidateCategories() {
  revalidatePath("/admin/categorias");
  // La navegación de categorías del storefront vive en el layout.
  revalidatePath("/", "layout");
}

export async function saveCategory(
  categoryId: string | null,
  input: unknown,
): Promise<SaveCategoryResult> {
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del formulario." };
  }
  const data = toSaveData(parsed.data);

  // Una categoría no puede ser su propia madre.
  if (categoryId && data.parentId === categoryId) {
    return {
      ok: false,
      error: "Una categoría no puede ser su propia categoría padre.",
    };
  }

  try {
    if (categoryId) {
      await updateCategory(categoryId, data);
    } else {
      await createCategory(data);
    }
  } catch (error) {
    if (isUniqueSlugError(error)) {
      return {
        ok: false,
        error: "Ya existe una categoría con ese slug.",
        field: "slug",
      };
    }
    throw error;
  }

  revalidateCategories();
  return { ok: true };
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<{ ok: true }> {
  await deleteCategory(categoryId);
  revalidateCategories();
  return { ok: true };
}
