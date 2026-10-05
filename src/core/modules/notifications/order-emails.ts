/**
 * Emails transaccionales de órdenes (M2.6).
 *
 * Plantillas en HTML con estilos inline (lo que entienden los
 * clientes de correo). Estas funciones son "best effort": atrapan
 * sus propios errores y nunca rompen el flujo que las invoca — un
 * email que falla no debe tumbar un checkout ni un webhook.
 */
import { sendEmail } from "@/core/integrations/resend";
import { formatPrice } from "@/core/lib/format";
import { SITE_URL } from "@/core/lib/seo";
import type { Order } from "@/core/modules/orders";
import { storeConfig } from "@/store.config";

const STORE_NAME = storeConfig.name;

/** Escapa texto para interpolar seguro en el HTML del email. */
function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char,
  );
}

interface OrderEmailParams {
  order: Order;
  heading: string;
  intro: string;
}

/** Arma el HTML de un email de orden (cabecera + ítems + total + CTA). */
function renderOrderEmail({ order, heading, intro }: OrderEmailParams): string {
  const cellBase =
    "padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#404040;";

  const itemRows = order.items
    .map((item) => {
      const name = item.variantName
        ? `${item.productName} (${item.variantName})`
        : item.productName;
      return `<tr>
        <td style="${cellBase}">${escapeHtml(name)} &times; ${item.quantity}</td>
        <td style="${cellBase}text-align:right;white-space:nowrap;">${formatPrice(item.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const shippingLabel =
    order.shipping.cost === 0 ? "Gratis" : formatPrice(order.shipping.cost);

  const couponRow = order.coupon
    ? `<tr>
          <td style="${cellBase}">Cupón ${escapeHtml(order.coupon.code)}</td>
          <td style="${cellBase}text-align:right;color:#15803d;">-${formatPrice(order.coupon.discount)}</td>
        </tr>`
    : "";

  return `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px;">
      <p style="margin:0 0 20px;font-size:13px;font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;color:#737373;">
        ${escapeHtml(STORE_NAME)}
      </p>
      <h1 style="margin:0 0 8px;font-size:20px;color:#171717;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#525252;">${escapeHtml(intro)}</p>

      <table style="width:100%;border-collapse:collapse;">
        ${itemRows}
        <tr>
          <td style="${cellBase}">Envío</td>
          <td style="${cellBase}text-align:right;">${shippingLabel}</td>
        </tr>
        ${couponRow}
        <tr>
          <td style="padding:12px 0;font-size:16px;font-weight:bold;color:#171717;">Total</td>
          <td style="padding:12px 0;text-align:right;font-size:16px;font-weight:bold;color:#171717;">${formatPrice(order.total)}</td>
        </tr>
      </table>

      <a href="${SITE_URL}/orden/${order.id}"
        style="display:inline-block;margin-top:20px;padding:10px 20px;background:#171717;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;">
        Ver mi pedido
      </a>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#a3a3a3;">
      Pedido #${order.number} &middot; ${escapeHtml(STORE_NAME)}
    </p>
  </div>
</body>
</html>`;
}

/** Email al cliente cuando se registra el pedido. */
export async function sendOrderPlacedEmail(order: Order): Promise<void> {
  try {
    await sendEmail({
      to: order.email,
      subject: `Pedido #${order.number} recibido`,
      html: renderOrderEmail({
        order,
        heading: `¡Gracias por tu compra, ${order.customerName}!`,
        intro: `Registramos tu pedido #${order.number}. Te avisamos por este medio cuando se confirme el pago.`,
      }),
    });
  } catch (error) {
    console.error(
      `No se pudo enviar el email del pedido #${order.number}:`,
      error,
    );
  }
}

/** Email al cliente cuando se confirma el pago. */
export async function sendOrderPaidEmail(order: Order): Promise<void> {
  try {
    await sendEmail({
      to: order.email,
      subject: `Pago confirmado · Pedido #${order.number}`,
      html: renderOrderEmail({
        order,
        heading: "¡Tu pago se confirmó!",
        intro: `Confirmamos el pago de tu pedido #${order.number}. Ya lo estamos preparando.`,
      }),
    });
  } catch (error) {
    console.error(
      `No se pudo enviar el email de pago del pedido #${order.number}:`,
      error,
    );
  }
}

/** Email al cliente cuando el pedido se despacha (M4.1). */
export async function sendOrderShippedEmail(order: Order): Promise<void> {
  try {
    const tracking = order.trackingCode
      ? ` Tu código de seguimiento es ${order.trackingCode}.`
      : "";
    await sendEmail({
      to: order.email,
      subject: `Pedido #${order.number} despachado`,
      html: renderOrderEmail({
        order,
        heading: "¡Tu pedido va en camino!",
        intro: `Despachamos tu pedido #${order.number}.${tracking}`,
      }),
    });
  } catch (error) {
    console.error(
      `No se pudo enviar el email de despacho del pedido #${order.number}:`,
      error,
    );
  }
}
