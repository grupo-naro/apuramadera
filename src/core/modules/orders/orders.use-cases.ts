/**
 * Use cases de órdenes.
 *
 * `createOrder` recalcula SIEMPRE los totales en el servidor a partir
 * de los ítems y el envío — nunca confía en montos de afuera. La
 * orden se crea en estado PENDING; pasa a PAID recién desde el
 * webhook de pago (M2.5).
 */
import * as repo from "./orders.repository";
import type { OrderExportRow } from "./orders.repository";
import {
  ADMIN_ORDERS_PAGE_SIZE,
  createOrderSchema,
  listOrdersInputSchema,
} from "./orders.schemas";
import { canTransition, type OrderStatus } from "./orders.status";
import type {
  AdminOrderListResult,
  CreateOrderInput,
  DashboardStats,
  Order,
} from "./orders.types";

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const data = createOrderSchema.parse(input);

  const items = data.items.map((item) => ({
    variantId: item.variantId,
    productId: item.productId,
    productName: item.productName,
    variantName: item.variantName ?? null,
    sku: item.sku ?? null,
    imagePublicId: item.imagePublicId ?? null,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.unitPrice * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  // Topeamos el descuento al subtotal — defensa en profundidad: el
  // caller ya revalidó el cupón con `validateCoupon`, pero por las
  // dudas no permitimos totales negativos.
  const couponDiscount = data.coupon
    ? Math.min(data.coupon.discount, subtotal)
    : 0;
  const total = subtotal + data.shipping.cost - couponDiscount;

  return repo.createOrder({
    email: data.email,
    customerName: data.customerName,
    phone: data.phone ?? null,
    shipping: data.shipping,
    subtotal,
    total,
    coupon: data.coupon
      ? { id: data.coupon.id, code: data.coupon.code, discount: couponDiscount }
      : null,
    items,
  });
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!id.trim()) return null;
  return repo.findOrderById(id);
}

export async function getOrderByNumber(
  orderNumber: number,
): Promise<Order | null> {
  if (!Number.isInteger(orderNumber) || orderNumber <= 0) return null;
  return repo.findOrderByNumber(orderNumber);
}

/** Métricas del dashboard del panel admin (M3.2). */
export async function getDashboardStats(): Promise<DashboardStats> {
  return repo.getDashboardStats();
}

/**
 * Marca una orden como pagada — lo invoca el webhook de Mercado Pago.
 * Idempotente: sólo actúa si la orden está PENDING (el webhook puede
 * llegar repetido). Devuelve la orden actualizada, o `null` si no
 * había nada que hacer.
 */
export async function markOrderPaid(
  orderId: string,
  paymentId: string,
): Promise<Order | null> {
  const order = await repo.findOrderById(orderId);
  if (!order || order.status !== "PENDING") return null;
  return repo.markOrderPaid(orderId, paymentId);
}

/** Listado paginado de órdenes para el panel admin (M4.1). */
export async function listAdminOrders(
  rawInput: unknown,
): Promise<AdminOrderListResult> {
  const input = listOrdersInputSchema.parse(rawInput ?? {});
  const pageSize = ADMIN_ORDERS_PAGE_SIZE;

  const { items, total } = await repo.listOrders({
    status: input.status,
    search: input.q,
    skip: (input.page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items,
    total,
    page: input.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Órdenes que matchean el filtro, para el export CSV (M4.3). */
export async function listOrdersForExport(
  rawInput: unknown,
): Promise<OrderExportRow[]> {
  const input = listOrdersInputSchema.parse(rawInput ?? {});
  return repo.findOrdersForExport({ status: input.status, search: input.q });
}

export interface UpdateOrderInput {
  status: OrderStatus;
  trackingCode: string | null;
}

/**
 * Actualiza una orden desde el panel: estado (validado contra la
 * máquina de estados) y código de seguimiento. Devuelve la orden y
 * si el estado cambió — la action decide si dispara el email.
 */
export async function updateOrderByAdmin(
  id: string,
  input: UpdateOrderInput,
): Promise<{ order: Order; statusChanged: boolean }> {
  const current = await repo.findOrderById(id);
  if (!current) throw new Error(`Orden ${id} no encontrada.`);

  const statusChanged = current.status !== input.status;
  if (statusChanged && !canTransition(current.status, input.status)) {
    throw new Error(
      `Transición de estado inválida: ${current.status} → ${input.status}.`,
    );
  }

  const order = await repo.updateOrder(id, {
    status: input.status,
    trackingCode: input.trackingCode,
  });
  return { order, statusChanged };
}
