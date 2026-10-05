/**
 * Máquina de estados de la orden.
 *
 * Define los estados, sus etiquetas legibles y las transiciones
 * válidas. `updateOrderStatus` (use-case) usa `canTransition` para
 * rechazar cambios de estado inválidos.
 */
export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente de pago",
  PAID: "Pagada",
  FULFILLED: "Preparada",
  SHIPPED: "Enviada",
  DELIVERED: "Entregada",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
};

/** Transiciones permitidas desde cada estado. */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["FULFILLED", "CANCELLED", "REFUNDED"],
  FULFILLED: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

/** ¿Es válido pasar de `from` a `to`? */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
