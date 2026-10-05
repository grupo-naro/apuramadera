/**
 * Módulo Carrito — API pública.
 *
 * Sólo expone Server Actions (seguras de importar desde componentes
 * cliente) y tipos. La cookie y el repositorio quedan encapsulados.
 *
 * Fase 2 · M2.1 — carrito persistente.
 */
export {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "./cart.actions";

export type { Cart, CartLine } from "./cart.types";
