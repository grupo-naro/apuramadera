/**
 * Seed de catálogo demo — A Pura Madera (muebles de baño en álamo
 * macizo).
 *
 * Carga un catálogo chico pero representativo para desarrollar el
 * storefront. Cubre los casos que importan: jerarquía de categorías,
 * productos con dos ejes de variación, producto simple (sin opciones),
 * descuento, stock 0 y un producto en DRAFT (que NO debe aparecer en
 * el storefront).
 *
 * Las imágenes referencian los archivos de `public/` (`/a1.jpeg`…):
 * `StoreImage` detecta el `/` inicial y las sirve con el optimizador
 * de next/image, sin pasar por Cloudinary (no hay credenciales de
 * subida en dev — el cloud `demo` es de sólo lectura).
 *
 * NO crea bloques de home: sin bloques, la home renderiza la versión
 * editorial de la marca. El panel puede agregar bloques para
 * sobreescribirla.
 *
 * Correr con: `pnpm db:seed`. Es destructivo — borra el catálogo
 * actual antes de cargar.
 */
import "dotenv/config";

import { prisma } from "@/core/lib/db";

type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  status: ProductStatus;
  categoryIds: string[];
  images: { publicId: string; alt: string }[];
  options: { name: string; values: string[] }[];
  variants: {
    sku: string;
    name: string | null;
    price: number; // centavos
    compareAtPrice?: number;
    stock: number;
    weightGrams?: number;
    /** { "Acabado": "Natural", "Medida": "80 cm" } — vacío si el producto no tiene opciones. */
    options: Record<string, string>;
  }[];
}

function img(publicId: string, alt: string) {
  return { publicId, alt };
}

async function seedProduct(input: SeedProduct) {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      status: input.status,
      categories: {
        create: input.categoryIds.map((categoryId) => ({ categoryId })),
      },
      images: {
        create: input.images.map((image, i) => ({
          publicId: image.publicId,
          alt: image.alt,
          sortOrder: i,
        })),
      },
      options: {
        create: input.options.map((option, oi) => ({
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

  // Mapa "Opción::Valor" → optionValueId, para enlazar las variantes.
  const valueId = new Map<string, string>();
  for (const option of product.options) {
    for (const value of option.values) {
      valueId.set(`${option.name}::${value.value}`, value.id);
    }
  }

  for (const variant of input.variants) {
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice ?? null,
        stock: variant.stock,
        weightGrams: variant.weightGrams ?? null,
        optionValues: {
          create: Object.entries(variant.options).map(([optName, val]) => {
            const id = valueId.get(`${optName}::${val}`);
            if (!id) {
              throw new Error(
                `Seed: la variante ${variant.sku} referencia ${optName}=${val}, que no existe en las opciones del producto.`,
              );
            }
            return { optionValueId: id };
          }),
        },
      },
    });
  }

  return product;
}

async function main() {
  console.log("⏳ Limpiando catálogo…");
  await prisma.homeBlock.deleteMany(); // sin bloques ⇒ home editorial
  await prisma.product.deleteMany(); // cascadea imágenes, opciones y variantes
  await prisma.category.deleteMany();

  console.log("⏳ Creando categorías…");
  const muebles = await prisma.category.create({
    data: {
      name: "Muebles",
      slug: "muebles",
      description: "Vanitorios, espejos y estantería en álamo macizo.",
      sortOrder: 0,
    },
  });
  const vanitorios = await prisma.category.create({
    data: {
      name: "Vanitorios",
      slug: "vanitorios",
      description: "Suspendidos y de piso, con terminación artesanal.",
      parentId: muebles.id,
      sortOrder: 0,
    },
  });
  const espejos = await prisma.category.create({
    data: {
      name: "Espejos",
      slug: "espejos",
      description: "Marco fino, a juego con cada vanitorio.",
      parentId: muebles.id,
      sortOrder: 1,
    },
  });
  const estanteria = await prisma.category.create({
    data: {
      name: "Estantería",
      slug: "estanteria",
      description: "Módulos abiertos para ordenar el baño.",
      parentId: muebles.id,
      sortOrder: 2,
    },
  });
  const bachas = await prisma.category.create({
    data: {
      name: "Bachas",
      slug: "bachas",
      description: "De apoyo, en cerámica y piedra.",
      sortOrder: 1,
    },
  });
  const accesorios = await prisma.category.create({
    data: {
      name: "Accesorios",
      slug: "accesorios",
      description: "Toalleros y complementos en negro mate.",
      sortOrder: 2,
    },
  });

  console.log("⏳ Creando productos…");

  const ACABADO = { name: "Acabado", values: ["Natural", "Ahumado", "Blanco"] };
  const MEDIDA = { name: "Medida", values: ["60 cm", "80 cm", "100 cm"] };

  // 1) Estrella: 2 ejes (Acabado × Medida), con descuento y una
  //    variante sin stock.
  await seedProduct({
    name: "Vanitorio Suspendido Listones",
    slug: "vanitorio-suspendido-listones",
    description:
      "Vanitorio suspendido con frente de listones en álamo macizo y estante inferior abierto. Encastre para bacha de apoyo. Incluye herrajes de cierre suave.\n\nSe entrega con terminación al agua, lista para colocar.",
    status: "ACTIVE",
    categoryIds: [vanitorios.id],
    images: [
      img("/a1.jpeg", "Vanitorio suspendido de listones, acabado natural"),
      img("/a2.jpeg", "Vanitorio suspendido con bacha de apoyo negra"),
    ],
    options: [ACABADO, MEDIDA],
    variants: [
      { sku: "VAN-LIST-NAT-60", name: "Natural / 60 cm", price: 42000000, compareAtPrice: 49000000, stock: 6, weightGrams: 18000, options: { Acabado: "Natural", Medida: "60 cm" } },
      { sku: "VAN-LIST-NAT-80", name: "Natural / 80 cm", price: 48000000, compareAtPrice: 55000000, stock: 4, weightGrams: 22000, options: { Acabado: "Natural", Medida: "80 cm" } },
      { sku: "VAN-LIST-NAT-100", name: "Natural / 100 cm", price: 56000000, stock: 3, weightGrams: 26000, options: { Acabado: "Natural", Medida: "100 cm" } },
      { sku: "VAN-LIST-AHU-60", name: "Ahumado / 60 cm", price: 44000000, stock: 2, weightGrams: 18000, options: { Acabado: "Ahumado", Medida: "60 cm" } },
      { sku: "VAN-LIST-AHU-80", name: "Ahumado / 80 cm", price: 50000000, stock: 0, weightGrams: 22000, options: { Acabado: "Ahumado", Medida: "80 cm" } },
      { sku: "VAN-LIST-BLA-80", name: "Blanco / 80 cm", price: 50000000, stock: 3, weightGrams: 22000, options: { Acabado: "Blanco", Medida: "80 cm" } },
    ],
  });

  // 2) Otro con 2 ejes.
  await seedProduct({
    name: "Vanitorio de Piso Cajones",
    slug: "vanitorio-de-piso-cajones",
    description:
      "Vanitorio de piso con dos cajones amplios sobre patas metálicas. Frente liso que deja ver la veta del álamo. Mesada de madera maciza con laca poliuretánica resistente a la humedad.",
    status: "ACTIVE",
    categoryIds: [vanitorios.id],
    images: [img("/a4.jpeg", "Vanitorio de piso con cajones en álamo natural")],
    options: [ACABADO, MEDIDA],
    variants: [
      { sku: "VAN-CAJ-NAT-80", name: "Natural / 80 cm", price: 52000000, stock: 5, weightGrams: 28000, options: { Acabado: "Natural", Medida: "80 cm" } },
      { sku: "VAN-CAJ-NAT-100", name: "Natural / 100 cm", price: 61000000, stock: 3, weightGrams: 33000, options: { Acabado: "Natural", Medida: "100 cm" } },
      { sku: "VAN-CAJ-AHU-80", name: "Ahumado / 80 cm", price: 54000000, stock: 2, weightGrams: 28000, options: { Acabado: "Ahumado", Medida: "80 cm" } },
      { sku: "VAN-CAJ-BLA-100", name: "Blanco / 100 cm", price: 63000000, stock: 1, weightGrams: 33000, options: { Acabado: "Blanco", Medida: "100 cm" } },
    ],
  });

  // 3) Un solo eje (Medida).
  await seedProduct({
    name: "Vanitorio Compacto",
    slug: "vanitorio-compacto",
    description:
      "Versión reducida para toilettes y baños de servicio. Un cajón y estante abierto. Álamo macizo con terminación natural.",
    status: "ACTIVE",
    categoryIds: [vanitorios.id],
    images: [img("/a5.jpeg", "Vanitorio compacto suspendido con bacha negra")],
    options: [{ name: "Medida", values: ["45 cm", "60 cm"] }],
    variants: [
      { sku: "VAN-COMP-45", name: "45 cm", price: 33000000, stock: 8, weightGrams: 12000, options: { Medida: "45 cm" } },
      { sku: "VAN-COMP-60", name: "60 cm", price: 38000000, stock: 6, weightGrams: 15000, options: { Medida: "60 cm" } },
    ],
  });

  // 4) Un solo eje (Color).
  await seedProduct({
    name: "Bacha de Apoyo Redonda",
    slug: "bacha-de-apoyo-redonda",
    description:
      "Bacha de apoyo de cerámica esmaltada, forma redonda de pared fina. Para montar sobre cualquier vanitorio de la línea. Válvula no incluida.",
    status: "ACTIVE",
    categoryIds: [bachas.id],
    images: [img("/a2.jpeg", "Bacha de apoyo redonda negra sobre vanitorio de madera")],
    options: [{ name: "Color", values: ["Negro mate", "Arena", "Gris piedra"] }],
    variants: [
      { sku: "BAC-RED-NEG", name: "Negro mate", price: 8900000, stock: 14, weightGrams: 4200, options: { Color: "Negro mate" } },
      { sku: "BAC-RED-ARE", name: "Arena", price: 8900000, stock: 9, weightGrams: 4200, options: { Color: "Arena" } },
      { sku: "BAC-RED-GRI", name: "Gris piedra", price: 9400000, stock: 5, weightGrams: 4400, options: { Color: "Gris piedra" } },
    ],
  });

  // 5) Producto simple: sin opciones, una sola variante.
  await seedProduct({
    name: "Bacha Esculpida Ovalada",
    slug: "bacha-esculpida-ovalada",
    description:
      "Bacha de apoyo tallada en piedra reconstituida, forma ovalada baja. Cada pieza tiene una veta única. Acabado mate al tacto.",
    status: "ACTIVE",
    categoryIds: [bachas.id],
    images: [img("/a7.jpeg", "Bacha ovalada de piedra sobre vanitorio de madera")],
    options: [],
    variants: [
      { sku: "BAC-OVAL-UNI", name: null, price: 12500000, stock: 7, weightGrams: 9000, options: {} },
    ],
  });

  // 6) Un solo eje (Diámetro).
  await seedProduct({
    name: "Espejo Redondo Marco Fino",
    slug: "espejo-redondo-marco-fino",
    description:
      "Espejo circular con marco metálico fino en negro mate. Fijación oculta a pared. Combina con toda la línea de vanitorios.",
    status: "ACTIVE",
    categoryIds: [espejos.id],
    images: [img("/a3.jpeg", "Espejo redondo de marco negro sobre pared de piedra")],
    options: [{ name: "Diámetro", values: ["60 cm", "80 cm"] }],
    variants: [
      { sku: "ESP-RED-60", name: "60 cm", price: 7200000, compareAtPrice: 8600000, stock: 11, weightGrams: 3800, options: { Diámetro: "60 cm" } },
      { sku: "ESP-RED-80", name: "80 cm", price: 9800000, compareAtPrice: 11500000, stock: 6, weightGrams: 5200, options: { Diámetro: "80 cm" } },
    ],
  });

  // 7) Producto simple.
  await seedProduct({
    name: "Espejo con Estante",
    slug: "espejo-con-estante",
    description:
      "Espejo rectangular con estante de álamo macizo integrado al pie. Para dejar a mano lo del día a día.",
    status: "ACTIVE",
    categoryIds: [espejos.id],
    images: [img("/a6.jpeg", "Espejo redondo con módulo de estantes de madera")],
    options: [],
    variants: [
      { sku: "ESP-EST-UNI", name: null, price: 11900000, stock: 4, weightGrams: 6000, options: {} },
    ],
  });

  // 8) Un solo eje (Medida).
  await seedProduct({
    name: "Módulo Estante Abierto",
    slug: "modulo-estante-abierto",
    description:
      "Cubo de estantes abiertos en álamo macizo para colgar sobre el inodoro o al lado del vanitorio. Dos alturas.",
    status: "ACTIVE",
    categoryIds: [estanteria.id],
    images: [img("/a6.jpeg", "Módulo de estantes abiertos de madera en el baño")],
    options: [{ name: "Medida", values: ["40 cm", "60 cm"] }],
    variants: [
      { sku: "EST-MOD-40", name: "40 cm", price: 5900000, stock: 10, weightGrams: 3500, options: { Medida: "40 cm" } },
      { sku: "EST-MOD-60", name: "60 cm", price: 7400000, stock: 7, weightGrams: 4800, options: { Medida: "60 cm" } },
    ],
  });

  // 9) Producto simple, ACTIVE, precio bajo.
  await seedProduct({
    name: "Toallero Barral Negro",
    slug: "toallero-barral-negro",
    description:
      "Barral de 50 cm en hierro con pintura epoxi negro mate. Tornillería incluida.",
    status: "ACTIVE",
    categoryIds: [accesorios.id],
    images: [img("/a1.jpeg", "Toallero barral negro junto a vanitorio de madera")],
    options: [],
    variants: [
      { sku: "ACC-TOA-50", name: null, price: 2400000, stock: 25, weightGrams: 900, options: {} },
    ],
  });

  // 10) Producto en DRAFT: NO debe aparecer en el storefront.
  await seedProduct({
    name: "Set Accesorios Baño (borrador)",
    slug: "set-accesorios-bano",
    description: "Producto en borrador para verificar que el storefront filtra los DRAFT.",
    status: "DRAFT",
    categoryIds: [accesorios.id],
    images: [img("/a5.jpeg", "Set de accesorios de baño")],
    options: [],
    variants: [
      { sku: "ACC-SET-UNI", name: null, price: 6900000, stock: 10, options: {} },
    ],
  });

  const [categories, products, variants] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
  ]);
  console.log(
    `✅ Seed completo: ${categories} categorías, ${products} productos, ${variants} variantes. Sin bloques de home (home editorial).`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Seed falló:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
