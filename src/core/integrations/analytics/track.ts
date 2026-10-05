/**
 * Eventos de ecommerce — fire-and-forget hacia GA4 y Meta Pixel.
 *
 * Cada `track*` dispara el evento en AMBOS proveedores (los que estén
 * configurados). Defensivo: si `window.gtag`/`window.fbq` no están,
 * no pasa nada. Las funciones son seguras de llamar desde cualquier
 * componente cliente (incluso desde efectos al montar).
 *
 * Los montos van en PESOS (la unidad principal de la moneda) — la app
 * trabaja en centavos, así que hay una conversión `/100`.
 */
declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      eventName: string,
      params?: Record<string, unknown>,
    ) => void;
    fbq?: (
      command: "track" | "trackCustom" | "init",
      eventName: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

const CURRENCY = "ARS";

/** Centavos → pesos (la unidad que esperan los reportes de analytics). */
const pesos = (centavos: number) => centavos / 100;

function gaEvent(name: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, params);
  }
}

function pixelEvent(name: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, params);
  }
}

export interface TrackedItem {
  /** Id estable del producto. */
  productId: string;
  name: string;
  /** Precio unitario en centavos. */
  unitPrice: number;
  quantity: number;
}

function gaItem(item: TrackedItem) {
  return {
    item_id: item.productId,
    item_name: item.name,
    price: pesos(item.unitPrice),
    quantity: item.quantity,
  };
}

export function trackViewItem(item: Omit<TrackedItem, "quantity">): void {
  const value = pesos(item.unitPrice);
  gaEvent("view_item", {
    currency: CURRENCY,
    value,
    items: [gaItem({ ...item, quantity: 1 })],
  });
  pixelEvent("ViewContent", {
    content_ids: [item.productId],
    content_type: "product",
    value,
    currency: CURRENCY,
  });
}

export function trackAddToCart(item: TrackedItem): void {
  const value = pesos(item.unitPrice * item.quantity);
  gaEvent("add_to_cart", {
    currency: CURRENCY,
    value,
    items: [gaItem(item)],
  });
  pixelEvent("AddToCart", {
    content_ids: [item.productId],
    content_type: "product",
    value,
    currency: CURRENCY,
  });
}

export interface CheckoutEventInput {
  /** Total del carrito en centavos. */
  value: number;
  items: TrackedItem[];
}

export function trackBeginCheckout(input: CheckoutEventInput): void {
  const value = pesos(input.value);
  gaEvent("begin_checkout", {
    currency: CURRENCY,
    value,
    items: input.items.map(gaItem),
  });
  pixelEvent("InitiateCheckout", {
    content_ids: input.items.map((item) => item.productId),
    contents: input.items.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
    })),
    value,
    currency: CURRENCY,
  });
}

export interface PurchaseEventInput {
  orderId: string;
  /** Total cobrado en centavos. */
  value: number;
  /** Costo de envío en centavos (opcional). */
  shippingCost?: number;
  items: TrackedItem[];
}

export function trackPurchase(input: PurchaseEventInput): void {
  const value = pesos(input.value);
  gaEvent("purchase", {
    transaction_id: input.orderId,
    currency: CURRENCY,
    value,
    shipping:
      input.shippingCost !== undefined ? pesos(input.shippingCost) : undefined,
    items: input.items.map(gaItem),
  });
  pixelEvent("Purchase", {
    content_ids: input.items.map((item) => item.productId),
    contents: input.items.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
    })),
    value,
    currency: CURRENCY,
  });
}
