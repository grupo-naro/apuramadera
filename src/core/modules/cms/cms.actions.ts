"use server";

/**
 * Server Actions del CMS (editor del panel).
 *
 * `saveBlock` valida el formulario con el schema del tipo y arma la
 * `data` que se persiste. Al guardar se revalida la home.
 */
import { revalidatePath } from "next/cache";

import {
  createBlock,
  deleteBlock,
  moveBlock,
  setBlockActive,
  updateBlock,
  type HomeBlockData,
} from "./cms.repository";
import {
  CAROUSEL_NEWEST_VALUE,
  HOME_BLOCK_FORM_SCHEMAS,
  type BlockFormValues,
  type HomeBlockType,
} from "./cms.schemas";

export type SaveBlockResult = { ok: true } | { ok: false; error: string };

/**
 * Sección "Contenido" deshabilitada temporalmente (ver
 * `app/admin/contenido/layout.tsx`). Las acciones siguen registradas pero
 * cortan antes de tocar la base para que no se pueda modificar nada aunque
 * alguien invoque el endpoint directo. Quitar esta guarda al reactivar.
 */
const CONTENT_EDITING_DISABLED =
  "La edición de contenido está deshabilitada temporalmente.";

// `as boolean` a propósito: ensancha el tipo para que el cuerpo de las
// acciones no quede marcado como código inalcanzable. Poner en `false`
// (o borrar las guardas) al reactivar la sección.
const CONTENT_LOCKED = true as boolean;

/** Revalida el editor y la home pública. */
function revalidateContent() {
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

/**
 * Convierte el string de `<input type="datetime-local">` a Date UTC.
 * El admin trabaja en UTC explícitamente (el form lo dice) — así no
 * dependemos de la zona horaria del navegador ni del servidor.
 */
function parseSchedule(value: string): Date | null {
  const trim = value.trim();
  if (!trim) return null;
  const withSeconds = /T\d{2}:\d{2}:\d{2}$/.test(trim) ? trim : `${trim}:00`;
  return new Date(`${withSeconds}Z`);
}

/** Arma la `data` a persistir a partir de los valores del formulario. */
function buildData(type: HomeBlockType, values: BlockFormValues): HomeBlockData {
  switch (type) {
    case "HERO_BANNER":
      return {
        imagePublicId: values.imagePublicId,
        imageAlt: values.imageAlt,
        heading: values.heading,
        subheading: values.subheading,
        ctaLabel: values.ctaLabel,
        ctaHref: values.ctaHref,
      };
    case "PRODUCT_CAROUSEL":
      return {
        heading: values.heading,
        categorySlug:
          values.categorySlug === CAROUSEL_NEWEST_VALUE
            ? ""
            : values.categorySlug,
        limit: Number(values.limit),
      };
    case "CATEGORY_GRID":
      return { heading: values.heading };
  }
}

export async function saveBlock(
  blockId: string | null,
  type: HomeBlockType,
  input: unknown,
): Promise<SaveBlockResult> {
  if (CONTENT_LOCKED) return { ok: false, error: CONTENT_EDITING_DISABLED };

  const parsed = HOME_BLOCK_FORM_SCHEMAS[type].safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del formulario." };
  }
  const values = parsed.data;
  const data = buildData(type, values);
  const startsAt = parseSchedule(values.startsAt);
  const endsAt = parseSchedule(values.endsAt);

  if (startsAt && endsAt && startsAt >= endsAt) {
    return {
      ok: false,
      error: "La fecha de fin debe ser posterior a la de inicio.",
    };
  }

  const persisted = { data, isActive: values.isActive, startsAt, endsAt };
  try {
    if (blockId) {
      await updateBlock(blockId, persisted);
    } else {
      await createBlock({ type, ...persisted });
    }
  } catch (error) {
    console.error("No se pudo guardar el bloque:", error);
    return { ok: false, error: "No se pudo guardar el bloque." };
  }

  revalidateContent();
  return { ok: true };
}

export async function deleteBlockAction(
  blockId: string,
): Promise<{ ok: true }> {
  if (CONTENT_LOCKED) throw new Error(CONTENT_EDITING_DISABLED);

  await deleteBlock(blockId);
  revalidateContent();
  return { ok: true };
}

export async function moveBlockAction(
  blockId: string,
  direction: "up" | "down",
): Promise<{ ok: true }> {
  if (CONTENT_LOCKED) throw new Error(CONTENT_EDITING_DISABLED);

  await moveBlock(blockId, direction);
  revalidateContent();
  return { ok: true };
}

export async function toggleBlockActiveAction(
  blockId: string,
  isActive: boolean,
): Promise<{ ok: true }> {
  if (CONTENT_LOCKED) throw new Error(CONTENT_EDITING_DISABLED);

  await setBlockActive(blockId, isActive);
  revalidateContent();
  return { ok: true };
}
