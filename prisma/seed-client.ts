/**
 * Seed por cliente — carga el catálogo de UNA tienda nueva desde un
 * JSON externo (M7.5).
 *
 * Uso: `pnpm db:seed:client ./mi-cliente/catalog.json`
 *
 * DESTRUCTIVO de catálogo: borra productos + categorías existentes
 * antes de insertar (vía `Product.deleteMany` + `Category.deleteMany`
 * — la cascada de Prisma se encarga de imágenes, opciones, variantes y
 * `ProductCategory`). NO toca órdenes, carritos, cupones, bloques CMS,
 * conexión de pagos ni auth — sólo catálogo.
 *
 * El formato del JSON está validado con Zod abajo y un ejemplo vive
 * en `seed-client.example.json`. Precios van en PESOS ENTEROS; el
 * script los castea a centavos.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

import { prisma } from "@/core/lib/db";

// ─── Schema del JSON de entrada ───────────────────────────────

const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  /** Slug de la categoría padre — null/omitido = raíz. */
  parentSlug: z.string().min(1).nullish(),
  isActive: z.boolean().default(true),
});

const imageSchema = z.object({
  publicId: z.string().min(1),
  alt: z.string().optional(),
});

const optionSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

const variantSchema = z.object({
  sku: z.string().optional(),
  name: z.string().nullish(),
  /** Precio en PESOS ENTEROS (15999 → $15.999). */
  priceArs: z.number().int().nonnegative(),
  compareAtPriceArs: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  weightGrams: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  /** { "Talle": "M", "Color": "Negro" } — vacío si el producto no tiene opciones. */
  options: z.record(z.string(), z.string()).default({}),
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().default(""),
  status: productStatusSchema.default("ACTIVE"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  /** Slugs de categorías a las que pertenece el producto. */
  categorySlugs: z.array(z.string().min(1)).default([]),
  images: z.array(imageSchema).default([]),
  options: z.array(optionSchema).default([]),
  variants: z.array(variantSchema).min(1),
});

const seedSchema = z.object({
  categories: z.array(categorySchema).default([]),
  products: z.array(productSchema).default([]),
});

type SeedInput = z.infer<typeof seedSchema>;
type CategoryInput = z.infer<typeof categorySchema>;
type ProductInput = z.infer<typeof productSchema>;

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Categorías pueden referenciar a su padre por `parentSlug` — necesitamos
 * insertar primero los padres. Topológico ordenado, detecta ciclos.
 */
function sortCategoriesByDependency(categories: CategoryInput[]): CategoryInput[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const sorted: CategoryInput[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(slug: string) {
    if (visited.has(slug)) return;
    if (visiting.has(slug)) {
      throw new Error(`Ciclo en categorías detectado en "${slug}".`);
    }
    const cat = bySlug.get(slug);
    if (!cat) {
      throw new Error(`Categoría referencia "parentSlug: ${slug}" que no existe.`);
    }
    visiting.add(slug);
    if (cat.parentSlug) visit(cat.parentSlug);
    visiting.delete(slug);
    visited.add(slug);
    sorted.push(cat);
  }

  for (const cat of categories) visit(cat.slug);
  return sorted;
}

async function insertCategories(
  categories: CategoryInput[],
): Promise<Map<string, string>> {
  const ordered = sortCategoriesByDependency(categories);
  const slugToId = new Map<string, string>();

  for (const cat of ordered) {
    const row = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        parentId: cat.parentSlug ? slugToId.get(cat.parentSlug) : null,
      },
      select: { id: true },
    });
    slugToId.set(cat.slug, row.id);
  }
  return slugToId;
}

async function insertProduct(
  product: ProductInput,
  categoryIdBySlug: Map<string, string>,
) {
  for (const slug of product.categorySlugs) {
    if (!categoryIdBySlug.has(slug)) {
      throw new Error(
        `Producto "${product.slug}" referencia "categorySlug: ${slug}" que no existe.`,
      );
    }
  }

  const created = await prisma.product.create({
    data: {
      name: product.name,
      slug: product.slug,
      description: product.description,
      status: product.status,
      metaTitle: product.metaTitle ?? null,
      metaDescription: product.metaDescription ?? null,
      categories: {
        create: product.categorySlugs.map((slug) => ({
          categoryId: categoryIdBySlug.get(slug)!,
        })),
      },
      images: {
        create: product.images.map((image, i) => ({
          publicId: image.publicId,
          alt: image.alt ?? null,
          sortOrder: i,
        })),
      },
      options: {
        create: product.options.map((option, oi) => ({
          name: option.name,
          sortOrder: oi,
          values: {
            create: option.values.map((value, vi) => ({ value, sortOrder: vi })),
          },
        })),
      },
    },
    include: { options: { include: { values: true } } },
  });

  const valueId = new Map<string, string>();
  for (const option of created.options) {
    for (const value of option.values) {
      valueId.set(`${option.name}::${value.value}`, value.id);
    }
  }

  for (const variant of product.variants) {
    await prisma.productVariant.create({
      data: {
        productId: created.id,
        sku: variant.sku ?? null,
        name: variant.name ?? null,
        price: variant.priceArs * 100,
        compareAtPrice:
          variant.compareAtPriceArs !== undefined
            ? variant.compareAtPriceArs * 100
            : null,
        stock: variant.stock,
        weightGrams: variant.weightGrams ?? null,
        isActive: variant.isActive,
        optionValues: {
          create: Object.entries(variant.options).map(([optName, val]) => {
            const id = valueId.get(`${optName}::${val}`);
            if (!id) {
              throw new Error(
                `Variante ${variant.sku ?? product.slug} referencia ${optName}=${val}, no existe en las opciones del producto.`,
              );
            }
            return { optionValueId: id };
          }),
        },
      },
    });
  }
}

// ─── Entry point ──────────────────────────────────────────────

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    throw new Error(
      "Falta el path al JSON del cliente. Uso: pnpm db:seed:client ./catalog.json",
    );
  }
  const path = resolve(process.cwd(), arg);

  console.log(`⏳ Leyendo ${path}…`);
  const raw = await readFile(path, "utf8");
  const parsed = seedSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error("❌ JSON inválido:");
    for (const issue of parsed.error.issues) {
      console.error(`  · ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  const data: SeedInput = parsed.data;

  console.log("⏳ Limpiando catálogo (productos + categorías)…");
  await prisma.product.deleteMany(); // cascadea images / options / variants / ProductCategory
  await prisma.category.deleteMany();

  console.log(`⏳ Insertando ${data.categories.length} categoría(s)…`);
  const categoryIdBySlug = await insertCategories(data.categories);

  console.log(`⏳ Insertando ${data.products.length} producto(s)…`);
  for (const product of data.products) {
    await insertProduct(product, categoryIdBySlug);
  }

  const [categories, products, variants] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
  ]);
  console.log(
    `✅ Seed completo: ${categories} categorías, ${products} productos, ${variants} variantes.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Seed cliente falló:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
