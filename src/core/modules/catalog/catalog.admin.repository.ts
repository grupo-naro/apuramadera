/**
 * Repositorio del catálogo para el panel admin — única capa que
 * habla con Prisma. A diferencia de `catalog.repository`, ve todos
 * los estados (borradores incluidos) y hace escrituras.
 *
 * Modelo unificado: un producto SIEMPRE es "opciones + variantes".
 * El producto simple no es un caso especial — es 0 opciones y 1
 * variante sin valores. Así, crear/actualizar es un único camino.
 *
 * Al actualizar, las opciones se reemplazan enteras, pero las
 * variantes se reconcilian por su "firma" (combinación de valores):
 * una combinación que no cambió conserva su id de variante, así los
 * ítems de carrito que la referencian sobreviven a la edición.
 *
 * Los precios se manejan en centavos.
 */
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/core/lib/db";

import type { ProductStatus } from "./catalog.admin.schemas";
import type {
  AdminProductForEdit,
  AdminProductListItem,
  CategoryOption,
} from "./catalog.admin.types";

// ─── Datos de escritura (ya validados, precios en centavos) ────

export interface SaveVariantData {
  /** Valores de las opciones, en el orden de `optionNames`. */
  values: string[];
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
}

export interface SaveImageData {
  publicId: string;
  alt: string | null;
}

export interface SaveProductData {
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  /** `publicId` del modelo 3D `.glb` en Cloudinary (`raw`), o null. */
  modelGlbPublicId: string | null;
  /** `publicId` del `.usdz` (iOS), generado desde el `.glb`, o null. */
  modelUsdzPublicId: string | null;
  categoryIds: string[];
  /** Imágenes en orden — la primera es la principal. */
  images: SaveImageData[];
  /** Ejes de variación. Vacío ⇒ producto simple. */
  optionNames: string[];
  /** Siempre ≥ 1. Producto simple ⇒ una variante con `values: []`. */
  variants: SaveVariantData[];
}

/** Bloque `images.create` para Prisma — asigna `sortOrder` por posición. */
function imageCreateData(images: SaveImageData[]) {
  return images.map((image, index) => ({
    publicId: image.publicId,
    alt: image.alt,
    sortOrder: index,
  }));
}

type Tx = Prisma.TransactionClient;

/** Firma canónica de una combinación de valores — para reconciliar. */
function signature(values: string[]): string {
  return values.map((v) => v.trim().toLowerCase()).join("");
}

// ─── Listado ───────────────────────────────────────────────────

const adminListSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  updatedAt: true,
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { publicId: true },
  },
  variants: { select: { price: true, stock: true } },
} satisfies Prisma.ProductSelect;

type AdminListRow = Prisma.ProductGetPayload<{ select: typeof adminListSelect }>;

function toAdminListItem(row: AdminListRow): AdminProductListItem {
  const prices = row.variants.map((v) => v.price);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    imagePublicId: row.images[0]?.publicId ?? null,
    variantCount: row.variants.length,
    price: prices.length > 0 ? Math.min(...prices) : 0,
    totalStock: row.variants.reduce((sum, v) => sum + v.stock, 0),
    updatedAt: row.updatedAt,
  };
}

/** Todos los productos, cualquier estado, los más nuevos primero. */
export async function listAdminProducts(): Promise<AdminProductListItem[]> {
  const rows = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    select: adminListSelect,
    take: 200,
  });
  return rows.map(toAdminListItem);
}

// ─── Producto para editar ──────────────────────────────────────

/** Producto por id con sus opciones y variantes. `null` si no existe. */
export async function getAdminProductForEdit(
  id: string,
): Promise<AdminProductForEdit | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      metaTitle: true,
      metaDescription: true,
      modelGlbPublicId: true,
      modelUsdzPublicId: true,
      categories: { select: { categoryId: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { publicId: true, alt: true },
      },
      options: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
      variants: {
        orderBy: { createdAt: "asc" },
        select: {
          sku: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          isActive: true,
          optionValues: {
            select: { optionValue: { select: { value: true, optionId: true } } },
          },
        },
      },
    },
  });
  if (!row) return null;

  const hasVariants = row.options.length > 0;
  const simple = hasVariants ? undefined : row.variants[0];
  const pesos = (centavos: number) => String(centavos / 100);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    status: row.status,
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    modelGlbPublicId: row.modelGlbPublicId ?? "",
    modelUsdzPublicId: row.modelUsdzPublicId ?? "",
    categoryIds: row.categories.map((c) => c.categoryId),
    images: row.images.map((image) => ({
      publicId: image.publicId,
      alt: image.alt ?? "",
    })),
    hasVariants,
    // Producto simple — campos de su variante única.
    sku: simple?.sku ?? "",
    price: simple ? pesos(simple.price) : "",
    compareAtPrice: simple?.compareAtPrice ? pesos(simple.compareAtPrice) : "",
    stock: simple ? String(simple.stock) : "",
    // Producto variable.
    options: row.options.map((o) => ({ name: o.name })),
    variants: hasVariants
      ? row.variants.map((variant) => ({
          values: row.options.map((option) => {
            const link = variant.optionValues.find(
              (ov) => ov.optionValue.optionId === option.id,
            );
            return link?.optionValue.value ?? "";
          }),
          sku: variant.sku ?? "",
          price: pesos(variant.price),
          compareAtPrice: variant.compareAtPrice
            ? pesos(variant.compareAtPrice)
            : "",
          stock: String(variant.stock),
          isActive: variant.isActive,
        }))
      : [],
  };
}

// ─── Categorías como opciones del formulario ───────────────────

/** Categorías aplanadas en orden de árbol, con profundidad. */
export async function listCategoryOptions(): Promise<CategoryOption[]> {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, parentId: true },
  });

  const childrenOf = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const siblings = childrenOf.get(row.parentId) ?? [];
    siblings.push(row);
    childrenOf.set(row.parentId, siblings);
  }

  const options: CategoryOption[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const node of childrenOf.get(parentId) ?? []) {
      options.push({ id: node.id, slug: node.slug, name: node.name, depth });
      walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  return options;
}

// ─── Escrituras ────────────────────────────────────────────────

/**
 * Crea las opciones del producto y sus valores (los valores
 * distintos que usan las variantes). Devuelve un mapa
 * `${índiceDeOpción}${valor}` → id del `ProductOptionValue`.
 */
async function createOptions(
  tx: Tx,
  productId: string,
  optionNames: string[],
  variants: SaveVariantData[],
): Promise<Map<string, string>> {
  const valueIdByKey = new Map<string, string>();

  for (let oi = 0; oi < optionNames.length; oi++) {
    const distinct: string[] = [];
    for (const variant of variants) {
      const value = variant.values[oi];
      if (value && !distinct.includes(value)) distinct.push(value);
    }
    const option = await tx.productOption.create({
      data: {
        productId,
        name: optionNames[oi],
        sortOrder: oi,
        values: {
          create: distinct.map((value, vi) => ({ value, sortOrder: vi })),
        },
      },
      select: { values: { select: { id: true, value: true } } },
    });
    for (const optionValue of option.values) {
      valueIdByKey.set(`${oi}${optionValue.value}`, optionValue.id);
    }
  }
  return valueIdByKey;
}

/** Links `ProductVariantOption` de una variante hacia sus valores. */
function variantLinks(
  values: string[],
  optionCount: number,
  valueIdByKey: Map<string, string>,
): { optionValueId: string }[] {
  return values.slice(0, optionCount).map((value, oi) => {
    const id = valueIdByKey.get(`${oi}${value}`);
    if (!id) throw new Error(`Valor de opción sin id: ${value}`);
    return { optionValueId: id };
  });
}

function variantName(values: string[], optionCount: number): string | null {
  return optionCount > 0 ? values.slice(0, optionCount).join(" / ") : null;
}

/**
 * Opciones de las transacciones interactivas de escritura. El default
 * de Prisma (`timeout: 5000`) se queda corto: crear/actualizar un
 * producto hace muchos round-trips secuenciales (opciones, valores y
 * una variante por combinación) y contra una base remota — pooled
 * (Neon) — la latencia acumulada lo pasa. `maxWait` cubre la espera
 * por una conexión del pool.
 */
const WRITE_TX_OPTIONS = { maxWait: 10_000, timeout: 30_000 } as const;

/** Crea un producto (con sus opciones y variantes). Devuelve el id. */
export async function createProduct(data: SaveProductData): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        modelGlbPublicId: data.modelGlbPublicId,
        modelUsdzPublicId: data.modelUsdzPublicId,
        categories: {
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
        images: { create: imageCreateData(data.images) },
      },
      select: { id: true },
    });

    const valueIds = await createOptions(
      tx,
      product.id,
      data.optionNames,
      data.variants,
    );
    const optionCount = data.optionNames.length;

    for (const variant of data.variants) {
      await tx.productVariant.create({
        data: {
          productId: product.id,
          name: variantName(variant.values, optionCount),
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stock: variant.stock,
          isActive: variant.isActive,
          optionValues: {
            create: variantLinks(variant.values, optionCount, valueIds),
          },
        },
      });
    }

    return product.id;
  }, WRITE_TX_OPTIONS);
}

/**
 * Actualiza un producto. Las opciones se reemplazan enteras; las
 * variantes se reconcilian por firma para conservar ids estables.
 */
export async function updateProduct(
  id: string,
  data: SaveProductData,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Firma → id de las variantes actuales.
    const existing = await tx.productVariant.findMany({
      where: { productId: id },
      select: {
        id: true,
        optionValues: {
          select: {
            optionValue: {
              select: {
                value: true,
                option: { select: { sortOrder: true } },
              },
            },
          },
        },
      },
    });
    const idBySignature = new Map<string, string>();
    for (const variant of existing) {
      const ordered = variant.optionValues
        .map((ov) => ({
          order: ov.optionValue.option.sortOrder,
          value: ov.optionValue.value,
        }))
        .sort((a, b) => a.order - b.order)
        .map((x) => x.value);
      idBySignature.set(signature(ordered), variant.id);
    }

    // 2. Datos generales + categorías.
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        modelGlbPublicId: data.modelGlbPublicId,
        modelUsdzPublicId: data.modelUsdzPublicId,
        categories: {
          deleteMany: {},
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
        images: {
          deleteMany: {},
          create: imageCreateData(data.images),
        },
      },
    });

    // 3. Opciones: reemplazo total (la cascada borra valores y links).
    await tx.productOption.deleteMany({ where: { productId: id } });
    const valueIds = await createOptions(
      tx,
      id,
      data.optionNames,
      data.variants,
    );
    const optionCount = data.optionNames.length;

    // 4. Variantes: reconciliar por firma.
    const keptIds: string[] = [];
    for (const variant of data.variants) {
      const links = variantLinks(variant.values, optionCount, valueIds);
      const fields = {
        name: variantName(variant.values, optionCount),
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stock: variant.stock,
        isActive: variant.isActive,
      };
      const existingId = idBySignature.get(
        signature(variant.values.slice(0, optionCount)),
      );
      if (existingId) {
        await tx.productVariant.update({
          where: { id: existingId },
          data: { ...fields, optionValues: { create: links } },
        });
        keptIds.push(existingId);
      } else {
        const created = await tx.productVariant.create({
          data: {
            productId: id,
            ...fields,
            optionValues: { create: links },
          },
          select: { id: true },
        });
        keptIds.push(created.id);
      }
    }

    // 5. Borrar las variantes que ya no existen.
    await tx.productVariant.deleteMany({
      where: { productId: id, id: { notIn: keptIds } },
    });
  }, WRITE_TX_OPTIONS);
}

/** Elimina un producto. Variantes, imágenes y vínculos caen en cascada. */
export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({ where: { id } });
}
