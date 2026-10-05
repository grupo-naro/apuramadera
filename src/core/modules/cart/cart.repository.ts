/**
 * Repositorio del carrito — única capa que habla con Prisma.
 */
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/core/lib/db";

import type { Cart, CartLine } from "./cart.types";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { publicId: true, alt: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function toCart(row: CartRow): Cart {
  const lines: CartLine[] = row.items.map((item) => {
    const { variant } = item;
    const { product } = variant;
    const image = product.images[0] ?? null;
    return {
      id: item.id,
      variantId: variant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      imagePublicId: image?.publicId ?? null,
      imageAlt: image?.alt ?? null,
      unitPrice: variant.price,
      quantity: item.quantity,
      lineTotal: variant.price * item.quantity,
      stock: variant.stock,
      inStock: variant.stock > 0,
    };
  });

  return {
    id: row.id,
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
  };
}

export async function findCart(cartId: string): Promise<Cart | null> {
  const row = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  return row ? toCart(row) : null;
}

export async function createCart(): Promise<string> {
  const cart = await prisma.cart.create({ data: {} });
  return cart.id;
}

/** Cantidad actual de una variante en el carrito (0 si no está). */
export async function findItemQuantity(
  cartId: string,
  variantId: string,
): Promise<number> {
  const item = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
    select: { quantity: true },
  });
  return item?.quantity ?? 0;
}

/** Fija la cantidad de una variante (la crea o la actualiza). */
export async function upsertItem(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<void> {
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity },
  });
}

export async function deleteItem(
  cartId: string,
  variantId: string,
): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { cartId, variantId } });
}

/** Borra el carrito entero (cascadea los ítems). */
export async function deleteCart(cartId: string): Promise<void> {
  await prisma.cart.deleteMany({ where: { id: cartId } });
}

/** Stock y estado de una variante — para validar al agregar/actualizar. */
export async function findVariantForCart(
  variantId: string,
): Promise<{ stock: number; isActive: boolean } | null> {
  return prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stock: true, isActive: true },
  });
}
