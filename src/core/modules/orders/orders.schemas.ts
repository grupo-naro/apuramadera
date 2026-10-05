/**
 * Validación de entrada para crear una orden (Zod).
 *
 * No incluye totales: `createOrder` los recalcula en el servidor a
 * partir de los ítems y el costo de envío — nunca se confía en
 * montos que llegan de afuera.
 */
import { z } from "zod";

import { ORDER_STATUSES } from "./orders.status";

const orderItemSchema = z.object({
  variantId: z.string().nullable(),
  productId: z.string().nullable(),
  productName: z.string().min(1),
  variantName: z.string().nullish(),
  sku: z.string().nullish(),
  imagePublicId: z.string().nullish(),
  unitPrice: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});

const orderShippingSchema = z.object({
  method: z.string().min(1),
  cost: z.number().int().nonnegative(),
  recipient: z.string().nullish(),
  street: z.string().nullish(),
  apartment: z.string().nullish(),
  city: z.string().nullish(),
  province: z.string().nullish(),
  postalCode: z.string().nullish(),
  notes: z.string().nullish(),
});

/** Snapshot de un cupón ya validado, listo para pegar en la orden. */
const orderCouponSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  discount: z.number().int().nonnegative(),
});

export const createOrderSchema = z.object({
  email: z.string().email(),
  customerName: z.string().min(1),
  phone: z.string().nullish(),
  shipping: orderShippingSchema,
  items: z.array(orderItemSchema).min(1),
  /** Cupón aplicado — null si no se aplicó ninguno. */
  coupon: orderCouponSchema.nullish(),
});

// ─── Listado de órdenes del panel admin (M4.1) ─────────────────

/** Órdenes por página en el panel. */
export const ADMIN_ORDERS_PAGE_SIZE = 20;

/**
 * Input del listado de órdenes — viene de los `searchParams`, así que
 * es tolerante: cada campo cae a un default si llega algo inválido.
 */
export const listOrdersInputSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  q: z.string().trim().min(1).max(100).optional().catch(undefined),
  page: z.coerce.number().int().positive().catch(1),
});

export type ListOrdersInput = z.infer<typeof listOrdersInputSchema>;
