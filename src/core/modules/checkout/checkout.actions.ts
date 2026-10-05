"use server";

/**
 * Server Action del checkout.
 *
 * Orquesta el cierre de la compra: lee el carrito, resuelve el envío
 * server-side, crea la orden PENDING (con snapshots) y vacía el
 * carrito. Los totales NO se reciben del cliente.
 *
 * Tres caminos según `channel`:
 *  · `"online"` con Mercado Pago conectado → preferencia + init_point.
 *  · `"online"` sin Mercado Pago → página de la orden (cobro por fuera).
 *  · `"whatsapp"` → arma el mensaje y devuelve la URL de wa.me además
 *    del orden page; el cliente queda en la orden y se le abre WA.
 */
import {
  buildWhatsAppUrl,
  isWhatsAppConfigured,
} from "@/core/integrations/whatsapp";
import { formatPrice } from "@/core/lib/format";
import { SITE_URL } from "@/core/lib/seo";
import { clearCart, fetchCart } from "@/core/modules/cart";
import { validateCoupon } from "@/core/modules/coupons";
import { sendOrderPlacedEmail } from "@/core/modules/notifications/order-emails";
import {
  CouponNoLongerAvailableError,
  createOrder,
  type Order,
} from "@/core/modules/orders";
import {
  createPaymentPreference,
  getPaymentConnectionStatus,
} from "@/core/modules/payments/payments.use-cases";
import { findShippingMethod } from "@/core/modules/shipping";

import { checkoutSchema } from "./checkout.schemas";

export type CheckoutChannel = "online" | "whatsapp";

export type CheckoutResult =
  | { ok: true; redirectUrl: string; whatsappUrl?: string }
  | { ok: false; error: string };

/** Arma el mensaje de WhatsApp con el detalle del pedido. */
function buildOrderMessage(order: Order): string {
  const lines = order.items
    .map((item) => {
      const variant = item.variantName ? ` (${item.variantName})` : "";
      return `· ${item.productName}${variant} × ${item.quantity} — ${formatPrice(item.lineTotal)}`;
    })
    .join("\n");

  const shipping =
    order.shipping.cost > 0
      ? `${order.shipping.method} (${formatPrice(order.shipping.cost)})`
      : order.shipping.method;

  const couponLine = order.coupon
    ? `Cupón ${order.coupon.code}: -${formatPrice(order.coupon.discount)}`
    : null;

  return [
    `¡Hola! Hice el pedido #${order.number} en la tienda.`,
    "",
    lines,
    "",
    `Envío: ${shipping}`,
    ...(couponLine ? [couponLine] : []),
    `Total: ${formatPrice(order.total)}`,
    "",
    `Detalle: ${SITE_URL}/orden/${order.id}`,
  ].join("\n");
}

export async function submitCheckout(
  input: unknown,
  channel: CheckoutChannel = "online",
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del formulario." };
  }
  const data = parsed.data;

  if (channel === "whatsapp" && !isWhatsAppConfigured) {
    return { ok: false, error: "WhatsApp no está configurado en esta tienda." };
  }

  const cart = await fetchCart();
  if (cart.lines.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }

  const method = findShippingMethod(data.shippingMethodId);
  if (!method) {
    return { ok: false, error: "El método de envío no es válido." };
  }
  const isDelivery = method.kind === "delivery";

  // Cupón: revalidamos server-side con el subtotal REAL (no el que
  // ve el cliente). Si el código está pero ya no aplica, abortamos
  // — el usuario debe sacar/cambiar el cupón antes de confirmar.
  const subtotal = cart.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  let couponSnapshot: { id: string; code: string; discount: number } | null =
    null;
  if (data.couponCode && data.couponCode.trim() !== "") {
    const result = await validateCoupon(data.couponCode, subtotal);
    if (!result.ok) return { ok: false, error: result.error };
    couponSnapshot = {
      id: result.coupon.id,
      code: result.coupon.code,
      discount: result.coupon.discount,
    };
  }

  let order;
  try {
    order = await createOrder({
      email: data.email,
      customerName: data.customerName,
      phone: data.phone?.trim() || null,
      shipping: {
        method: method.label,
        cost: method.cost,
        recipient: isDelivery
          ? data.recipient?.trim() || data.customerName
          : null,
        street: isDelivery ? data.street?.trim() || null : null,
        apartment: isDelivery ? data.apartment?.trim() || null : null,
        city: isDelivery ? data.city?.trim() || null : null,
        province: isDelivery ? data.province?.trim() || null : null,
        postalCode: isDelivery ? data.postalCode?.trim() || null : null,
        notes: data.notes?.trim() || null,
      },
      items: cart.lines.map((line) => ({
        variantId: line.variantId,
        productId: line.productId,
        productName: line.productName,
        variantName: line.variantName,
        sku: line.sku,
        imagePublicId: line.imagePublicId,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      })),
      coupon: couponSnapshot,
    });
    await clearCart();
  } catch (error) {
    if (error instanceof CouponNoLongerAvailableError) {
      return {
        ok: false,
        error: "El cupón ya no está disponible. Quitalo e intentá de nuevo.",
      };
    }
    console.error("Checkout falló:", error);
    return {
      ok: false,
      error: "No pudimos procesar el pedido. Intentá de nuevo.",
    };
  }

  // Email de "pedido recibido" (best effort — no rompe el checkout).
  await sendOrderPlacedEmail(order);

  const orderPage = `/orden/${order.id}`;

  // Canal WhatsApp: cobro fuera de la plataforma. Devolvemos la URL
  // de wa.me para que el cliente abra el chat con el detalle pre-armado.
  if (channel === "whatsapp") {
    return {
      ok: true,
      redirectUrl: orderPage,
      whatsappUrl: buildWhatsAppUrl(buildOrderMessage(order)),
    };
  }

  // Canal online: Mercado Pago si está conectado.
  const connection = await getPaymentConnectionStatus();
  if (!connection.connected) {
    return { ok: true, redirectUrl: orderPage };
  }

  try {
    const { initPoint } = await createPaymentPreference({
      orderId: order.id,
      orderNumber: order.number,
      payerEmail: order.email,
      shippingCost: order.shipping.cost,
      couponDiscount: order.couponDiscount,
      items: order.items.map((item) => ({
        title: item.variantName
          ? `${item.productName} — ${item.variantName}`
          : item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
    return { ok: true, redirectUrl: initPoint };
  } catch (error) {
    // La orden ya existe (PENDING); se cae a su página de detalle.
    console.error("No se pudo crear la preferencia de pago:", error);
    return { ok: true, redirectUrl: orderPage };
  }
}
