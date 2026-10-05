/**
 * Tipos de dominio de clientes.
 *
 * No hay tabla `Customer` — el checkout es como invitado. Un
 * "cliente" se deriva agrupando las órdenes por email.
 */
import type { OrderSummary } from "@/core/modules/orders";

/** Cliente agregado — una fila del listado del panel. */
export interface CustomerSummary {
  email: string;
  /** Nombre del pedido más reciente. */
  name: string;
  orderCount: number;
  /** Suma del total de todos sus pedidos, en centavos. */
  totalSpent: number;
  lastOrderAt: Date;
}

/** Cliente con su historial de pedidos. */
export interface CustomerDetail extends CustomerSummary {
  firstOrderAt: Date;
  orders: OrderSummary[];
}
