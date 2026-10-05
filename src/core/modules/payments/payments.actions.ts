"use server";

/**
 * Server Actions del módulo de pagos.
 *
 * La conexión se inicia desde una ruta (`/api/payments/...`), no acá:
 * el OAuth necesita redirecciones del navegador. Esta action sólo
 * cubre la desconexión.
 */
import { revalidatePath } from "next/cache";

import { disconnectPayment } from "./payments.use-cases";

export async function disconnectMercadoPagoAction(): Promise<{ ok: true }> {
  await disconnectPayment();
  revalidatePath("/admin/configuracion");
  return { ok: true };
}
