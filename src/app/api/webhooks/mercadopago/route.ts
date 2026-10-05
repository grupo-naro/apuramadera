/**
 * Webhook de Mercado Pago.
 *
 * MP avisa acá cuando cambia un pago. La notificación es sólo un
 * "ping" con el id del pago — NO se confía en su contenido: se vuelve
 * a consultar el pago en la API de MP (con el token de la tienda).
 * Eso hace inofensivo un webhook falsificado: un atacante no tiene un
 * id de pago real y aprobado de esta cuenta.
 *
 * `markOrderPaid` es idempotente, así que reintentos de MP no duplican
 * nada. Esta ruta es pública (MP no manda sesión) y no pasa por el
 * proxy.
 */
import { NextResponse } from "next/server";

import { sendOrderPaidEmail } from "@/core/modules/notifications/order-emails";
import { markOrderPaid } from "@/core/modules/orders";
import { fetchPaymentInfo } from "@/core/modules/payments/payments.use-cases";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      topic?: string;
      data?: { id?: string | number };
    };

    const type = body.type ?? body.topic ?? url.searchParams.get("type");
    const paymentId =
      body.data?.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id");

    // Sólo interesan las notificaciones de pago.
    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    const payment = await fetchPaymentInfo(String(paymentId));
    if (payment.status === "approved" && payment.orderId) {
      const order = await markOrderPaid(payment.orderId, payment.paymentId);
      // `order` no es null sólo en la transición real a PAID — así el
      // email de pago se manda una vez aunque MP reintente el webhook.
      if (order) await sendOrderPaidEmail(order);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // 500 ⇒ MP reintenta la notificación más tarde.
    console.error("Webhook Mercado Pago falló:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
