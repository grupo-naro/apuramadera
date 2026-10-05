/**
 * Repositorio del CMS — única capa que habla con Prisma.
 *
 * Incluye el acceso del storefront (`listActiveBlocks`) y el del
 * editor del panel (lista completa + CRUD + reordenar).
 */
import { prisma } from "@/core/lib/db";

import {
  CAROUSEL_NEWEST_VALUE,
  HOME_BLOCK_SCHEMAS,
  HOME_BLOCK_TYPE_LABELS,
  type CategoryGridData,
  type HeroBannerData,
  type HomeBlockType,
  type ProductCarouselData,
} from "./cms.schemas";
import type { HomeBlockForEdit, HomeBlockListItem } from "./cms.types";

/** Config concreta de un bloque (lo que se guarda en `data`). */
export type HomeBlockData =
  | HeroBannerData
  | ProductCarouselData
  | CategoryGridData;

// ─── Storefront ────────────────────────────────────────────────

/**
 * Bloques activos, ordenados. En modo `preview` se ignora la ventana
 * `startsAt`/`endsAt` — sirve para que el admin vea los bloques
 * programados a futuro sin tener que esperar a la fecha.
 */
export async function listActiveBlocks(preview = false) {
  if (preview) {
    return prisma.homeBlock.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }
  const now = new Date();
  return prisma.homeBlock.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
}

// ─── Editor del panel ──────────────────────────────────────────

/** Resumen de una línea para el listado del editor. */
function summarize(type: HomeBlockType, raw: unknown): string {
  const parsed = HOME_BLOCK_SCHEMAS[type].safeParse(raw);
  if (!parsed.success) return "Configuración incompleta";
  return parsed.data.heading || HOME_BLOCK_TYPE_LABELS[type];
}

/** Todos los bloques (cualquier estado), ordenados — para el editor. */
export async function listAdminBlocks(): Promise<HomeBlockListItem[]> {
  const rows = await prisma.homeBlock.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    isActive: row.isActive,
    summary: summarize(row.type, row.data),
  }));
}

/** Bloque por id mapeado a los valores del formulario. `null` si no existe. */
export async function getBlockForEdit(
  id: string,
): Promise<HomeBlockForEdit | null> {
  const row = await prisma.homeBlock.findUnique({ where: { id } });
  if (!row) return null;

  const values = {
    isActive: row.isActive,
    heading: "",
    imagePublicId: "",
    imageAlt: "",
    subheading: "",
    ctaLabel: "",
    ctaHref: "",
    categorySlug: CAROUSEL_NEWEST_VALUE,
    limit: "8",
    startsAt: row.startsAt ? row.startsAt.toISOString().slice(0, 16) : "",
    endsAt: row.endsAt ? row.endsAt.toISOString().slice(0, 16) : "",
  };

  const parsed = HOME_BLOCK_SCHEMAS[row.type].safeParse(row.data);
  if (parsed.success) {
    if (row.type === "HERO_BANNER") {
      const data = parsed.data as HeroBannerData;
      values.heading = data.heading;
      values.imagePublicId = data.imagePublicId;
      values.imageAlt = data.imageAlt;
      values.subheading = data.subheading;
      values.ctaLabel = data.ctaLabel;
      values.ctaHref = data.ctaHref;
    } else if (row.type === "PRODUCT_CAROUSEL") {
      const data = parsed.data as ProductCarouselData;
      values.heading = data.heading;
      values.categorySlug = data.categorySlug || CAROUSEL_NEWEST_VALUE;
      values.limit = String(data.limit);
    } else {
      values.heading = (parsed.data as CategoryGridData).heading;
    }
  }

  return { id: row.id, type: row.type, values };
}

export interface SaveBlockInput {
  type: HomeBlockType;
  data: HomeBlockData;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

/** Crea un bloque — va al final del orden. Devuelve el id. */
export async function createBlock(input: SaveBlockInput): Promise<string> {
  const aggregate = await prisma.homeBlock.aggregate({
    _max: { sortOrder: true },
  });
  const sortOrder = (aggregate._max.sortOrder ?? -1) + 1;

  const block = await prisma.homeBlock.create({
    data: {
      type: input.type,
      data: input.data,
      isActive: input.isActive,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      sortOrder,
    },
    select: { id: true },
  });
  return block.id;
}

/** Actualiza la config y la programación de un bloque (el tipo no cambia). */
export async function updateBlock(
  id: string,
  input: Omit<SaveBlockInput, "type">,
): Promise<void> {
  await prisma.homeBlock.update({
    where: { id },
    data: {
      data: input.data,
      isActive: input.isActive,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function deleteBlock(id: string): Promise<void> {
  await prisma.homeBlock.delete({ where: { id } });
}

export async function setBlockActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await prisma.homeBlock.update({ where: { id }, data: { isActive } });
}

/** Mueve un bloque una posición — intercambia el `sortOrder` con el vecino. */
export async function moveBlock(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const blocks = await prisma.homeBlock.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  const index = blocks.findIndex((block) => block.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= blocks.length) return;

  const current = blocks[index];
  const neighbour = blocks[swapIndex];
  await prisma.$transaction([
    prisma.homeBlock.update({
      where: { id: current.id },
      data: { sortOrder: neighbour.sortOrder },
    }),
    prisma.homeBlock.update({
      where: { id: neighbour.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
}
