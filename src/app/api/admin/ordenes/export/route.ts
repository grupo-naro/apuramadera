/**
 * Export CSV de órdenes (M4.3).
 *
 * Devuelve las órdenes que matchean los filtros (`status`, `q`) como
 * un archivo CSV descargable. `/api/*` no pasa por el proxy, así que
 * la verificación de admin es explícita.
 */
import { requireActiveAdmin } from "@/core/auth/require-active-admin";
import { buildCsv } from "@/core/lib/csv";
import { listOrdersForExport, ORDER_STATUS_LABELS } from "@/core/modules/orders";

const HEADERS = [
  "N° orden",
  "Fecha",
  "Estado",
  "Cliente",
  "Email",
  "Teléfono",
  "Método de envío",
  "Costo de envío",
  "Dirección de envío",
  "Subtotal",
  "Cupón",
  "Descuento",
  "Total",
  "Código de seguimiento",
  "ID de pago",
];

/** Centavos → pesos con 2 decimales (formato neutro para planillas). */
const pesos = (centavos: number) => (centavos / 100).toFixed(2);

/** Fecha ordenable: "2026-05-22 14:30". */
const formatDate = (date: Date) =>
  date.toISOString().slice(0, 16).replace("T", " ");

export async function GET(request: Request) {
  const user = await requireActiveAdmin();
  if (!user) {
    return new Response("No autorizado", { status: 401 });
  }

  const url = new URL(request.url);
  const orders = await listOrdersForExport({
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });

  const rows = orders.map((order) => [
    String(order.number),
    formatDate(order.createdAt),
    ORDER_STATUS_LABELS[order.status],
    order.customerName,
    order.email,
    order.phone ?? "",
    order.shippingMethod,
    pesos(order.shippingCost),
    order.shippingAddress,
    pesos(order.subtotal),
    order.couponCode,
    pesos(order.couponDiscount),
    pesos(order.total),
    order.trackingCode ?? "",
    order.paymentId ?? "",
  ]);

  // BOM para que Excel detecte UTF-8 (acentos).
  const csv = `﻿${buildCsv(HEADERS, rows)}`;
  const filename = `ordenes-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
