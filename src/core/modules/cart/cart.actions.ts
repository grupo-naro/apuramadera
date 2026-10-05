"use server";

/**
 * Server Actions del carrito.
 *
 * Toda mutación del carrito pasa por acá: leen/crean la cookie del
 * carrito, validan stock y devuelven el carrito actualizado (lo
 * consume el store de Zustand del cliente). El servidor es la única
 * fuente de verdad.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  clearCartCookie,
  getCartIdFromCookie,
  setCartIdCookie,
} from "./cart.cookie";
import * as repo from "./cart.repository";
import type { Cart } from "./cart.types";

const EMPTY_CART: Cart = { id: null, lines: [], itemCount: 0, subtotal: 0 };

const variantIdSchema = z.string().min(1);

/** Carga el carrito por id (vacío si no hay id o no existe). */
async function loadCart(cartId: string | null): Promise<Cart> {
  if (!cartId) return EMPTY_CART;
  return (await repo.findCart(cartId)) ?? EMPTY_CART;
}

/** Lee el carrito actual — para hidratar el cliente y la página /carrito. */
export async function fetchCart(): Promise<Cart> {
  return loadCart(await getCartIdFromCookie());
}

/** Agrega `quantity` unidades de una variante (sumando a lo que ya haya). */
export async function addToCart(
  variantId: string,
  quantity: number,
): Promise<Cart> {
  variantIdSchema.parse(variantId);
  const qty = z.number().int().positive().parse(quantity);

  const variant = await repo.findVariantForCart(variantId);
  if (!variant || !variant.isActive) {
    throw new Error("La variante no está disponible.");
  }

  let cartId = await getCartIdFromCookie();
  if (!cartId) {
    cartId = await repo.createCart();
    await setCartIdCookie(cartId);
  }

  const current = await repo.findItemQuantity(cartId, variantId);
  // No se puede superar el stock disponible.
  const finalQty = Math.min(current + qty, variant.stock);
  if (finalQty > 0 && finalQty !== current) {
    await repo.upsertItem(cartId, variantId, finalQty);
  }

  revalidatePath("/carrito");
  return loadCart(cartId);
}

/** Fija la cantidad de una variante. `quantity <= 0` la elimina. */
export async function updateCartItem(
  variantId: string,
  quantity: number,
): Promise<Cart> {
  variantIdSchema.parse(variantId);
  const qty = z.number().int().min(0).parse(quantity);

  const cartId = await getCartIdFromCookie();
  if (!cartId) return EMPTY_CART;

  if (qty <= 0) {
    await repo.deleteItem(cartId, variantId);
  } else {
    const variant = await repo.findVariantForCart(variantId);
    const finalQty = Math.min(qty, variant?.stock ?? 0);
    if (finalQty <= 0) {
      await repo.deleteItem(cartId, variantId);
    } else {
      await repo.upsertItem(cartId, variantId, finalQty);
    }
  }

  revalidatePath("/carrito");
  return loadCart(cartId);
}

/** Saca una variante del carrito. */
export async function removeFromCart(variantId: string): Promise<Cart> {
  variantIdSchema.parse(variantId);

  const cartId = await getCartIdFromCookie();
  if (!cartId) return EMPTY_CART;

  await repo.deleteItem(cartId, variantId);
  revalidatePath("/carrito");
  return loadCart(cartId);
}

/** Vacía el carrito y borra la cookie — se usa al confirmar el checkout. */
export async function clearCart(): Promise<void> {
  const cartId = await getCartIdFromCookie();
  if (cartId) await repo.deleteCart(cartId);
  await clearCartCookie();
  revalidatePath("/carrito");
}
