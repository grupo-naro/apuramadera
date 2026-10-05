/**
 * Módulo Checkout — API pública.
 *
 * Fase 2 · M2.4 — flujo de checkout. Orquesta carrito + envíos +
 * órdenes. El pago (MercadoPago) se conecta en M2.5.
 */
export {
  submitCheckout,
  type CheckoutChannel,
  type CheckoutResult,
} from "./checkout.actions";
export { checkoutSchema, type CheckoutInput } from "./checkout.schemas";
