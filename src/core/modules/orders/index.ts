/**
 * Módulo Órdenes — API pública.
 *
 * Fase 2 · M2.3 — modelo de órdenes. El checkout (M2.4) consume
 * `createOrder`; el webhook de pago (M2.5) y el admin (F3) usan
 * `updateOrderStatus`.
 */
export {
  createOrder,
  getOrderById,
  getOrderByNumber,
  getDashboardStats,
  listAdminOrders,
  listOrdersForExport,
  markOrderPaid,
  updateOrderByAdmin,
  type UpdateOrderInput,
} from "./orders.use-cases";

export {
  CouponNoLongerAvailableError,
  type OrderExportRow,
} from "./orders.repository";

export {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  canTransition,
  type OrderStatus,
} from "./orders.status";

export type {
  Order,
  OrderCoupon,
  OrderItem,
  OrderShipping,
  OrderSummary,
  TopProduct,
  DashboardStats,
  AdminOrderListResult,
  CreateOrderInput,
  CreateOrderItemInput,
  CreateOrderShippingInput,
} from "./orders.types";

export {
  createOrderSchema,
  listOrdersInputSchema,
  ADMIN_ORDERS_PAGE_SIZE,
  type ListOrdersInput,
} from "./orders.schemas";
