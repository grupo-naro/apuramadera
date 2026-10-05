/**
 * Repositorio de categorías para el panel admin — única capa que
 * habla con Prisma para el CRUD de categorías.
 *
 * Las categorías son un árbol (auto-referencia `parentId`). El
 * listado y el select de padre devuelven el árbol aplanado con
 * `depth` para indentarlo en la UI.
 */
import { prisma } from "@/core/lib/db";

import { NO_PARENT } from "./catalog.admin.schemas";
import type {
  AdminCategoryForEdit,
  AdminCategoryNode,
  CategoryOption,
} from "./catalog.admin.types";

export interface SaveCategoryData {
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryRow {
  id: string;
  name: string;
  parentId: string | null;
}

/** Agrupa las categorías por su `parentId`. */
function groupByParent<T extends CategoryRow>(rows: T[]): Map<string | null, T[]> {
  const byParent = new Map<string | null, T[]>();
  for (const row of rows) {
    const siblings = byParent.get(row.parentId) ?? [];
    siblings.push(row);
    byParent.set(row.parentId, siblings);
  }
  return byParent;
}

// ─── Listado ───────────────────────────────────────────────────

/** Categorías como árbol aplanado, con profundidad y cantidad de productos. */
export async function listAdminCategories(): Promise<AdminCategoryNode[]> {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  const byParent = groupByParent(rows);
  const nodes: AdminCategoryNode[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const row of byParent.get(parentId) ?? []) {
      nodes.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        depth,
        isActive: row.isActive,
        productCount: row._count.products,
      });
      walk(row.id, depth + 1);
    }
  };
  walk(null, 0);
  return nodes;
}

/**
 * Categorías que pueden ser padre — árbol aplanado. Excluye la
 * categoría `excludeId` y sus descendientes (evita ciclos al editar).
 */
export async function listParentOptions(
  excludeId?: string,
): Promise<CategoryOption[]> {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, parentId: true },
  });

  const byParent = groupByParent(rows);
  const options: CategoryOption[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const row of byParent.get(parentId) ?? []) {
      if (row.id === excludeId) continue; // se salta el subárbol entero
      options.push({ id: row.id, slug: row.slug, name: row.name, depth });
      walk(row.id, depth + 1);
    }
  };
  walk(null, 0);
  return options;
}

// ─── Categoría para editar ─────────────────────────────────────

export async function getAdminCategoryForEdit(
  id: string,
): Promise<AdminCategoryForEdit | null> {
  const row = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      sortOrder: true,
      isActive: true,
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    parentId: row.parentId ?? NO_PARENT,
    sortOrder: String(row.sortOrder),
    isActive: row.isActive,
  };
}

// ─── Escrituras ────────────────────────────────────────────────

export async function createCategory(
  data: SaveCategoryData,
): Promise<string> {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
    select: { id: true },
  });
  return category.id;
}

export async function updateCategory(
  id: string,
  data: SaveCategoryData,
): Promise<void> {
  await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

/** Elimina una categoría. Las hijas quedan como raíz (parentId → null). */
export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
}
