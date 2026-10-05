/**
 * Cookie que identifica el carrito anónimo (`cart_id`).
 *
 * Leer funciona en render y en Server Actions; escribir SÓLO en
 * Server Actions / Route Handlers.
 */
import { cookies } from "next/headers";

const CART_COOKIE = "cart_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function getCartIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export async function setCartIdCookie(cartId: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearCartCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
