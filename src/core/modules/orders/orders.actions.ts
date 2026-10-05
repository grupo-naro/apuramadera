"use server";

/**
 * Server Actions de órdenes (panel admin).
 *
 * `updateOrderAction` cambia el estado (validado contra la máquina
 * de estados en `updateOrderByAdmin`) y el código de seguimiento.
 * Al pasar a SHIPPED dispara el email de despacho.
 */
import { revalidatePath } from "next/cache";

import { sendOrderShippedEmail } from "@/core/modules/notifications/order-emails";

import { ORDER_STATUSES, type OrderStatus } from "./orders.status";
import { updateOrderByAdmin } from "./orders.use-cases";

export type UpdateOrderResult = { ok: true } | { ok: false; error: string };

export async function updateOrderAction(
  orderId: string,
  input: { status: string; trackingCode: string },
): Promise<UpdateOrderResult> {
  if (!ORDER_STATUSES.includes(input.status as OrderStatus)) {
    return { ok: false, error: "Estado inválido." };
  }
  const status = input.status as OrderStatus;
  const trackingCode = input.trackingCode.trim() || null;

  try {
    const { order, statusChanged } = await updateOrderByAdmin(orderId, {
      status,
      trackingCode,
    });
    if (statusChanged && order.status === "SHIPPED") {
      await sendOrderShippedEmail(order);
    }
  } catch (error) {
    console.error("No se pudo actualizar la orden:", error);
    return {
      ok: false,
      error: "No se pudo actualizar — revisá que la transición de estado sea válida.",
    };
  }

  revalidatePath("/admin/ordenes");
  revalidatePath(`/admin/ordenes/${orderId}`);
  return { ok: true };
}
