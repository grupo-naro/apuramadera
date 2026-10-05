/**
 * Tipos de dominio de las órdenes.
 *
 * La orden es un documento inmutable: cada `OrderItem` guarda
 * snapshots (nombre, precio, atributos) del momento de la compra.
 * Dinero en centavos.
 */
import type { OrderStatus } from "./orders.status";

/** Ítem de orden — snapshot de lo comprado. */
export interface OrderItem {
  id: string;
  /** Punteros informativos al catálogo (pueden quedar huérfanos). */
  variantId: string | null;
  productId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  imagePublicId: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** Datos de envío de la orden (dirección null si es retiro en local). */
export interface OrderShipping {
  method: string;
  cost: number;
  recipient: string | null;
  street: string | null;
  apartment: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  notes: string | null;
}

/**
 * Snapshot del cupón aplicado a una orden. Los tres campos quedan en
 * la orden como columnas — no hay FK al modelo Coupon, así borrar un
 * cupón no rompe el documento histórico.
 */
export interface OrderCoupon {
  id: string;
  code: string;
  /** Monto descontado en centavos. */
  discount: number;
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  email: string;
  customerName: string;
  phone: string | null;
  shipping: OrderShipping;
  items: OrderItem[];
  subtotal: number;
  /** Descuento aplicado por el cupón (centavos). 0 si no había cupón. */
  couponDiscount: number;
  /** Cupón aplicado, o null si no se usó ninguno. */
  coupon: OrderCoupon | null;
  total: number;
  paymentId: string | null;
  /** Código de seguimiento del envío — lo carga el admin. */
  trackingCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Input de creación ─────────────────────────────────────────
// Lo arma el checkout (M2.4). Los totales NO se reciben: se
// recalculan en el servidor a partir de los ítems y el envío.

export interface CreateOrderItemInput {
  variantId: string | null;
  productId: string | null;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  imagePublicId?: string | null;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderShippingInput {
  method: string;
  cost: number;
  recipient?: string | null;
  street?: string | null;
  apartment?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  notes?: string | null;
}

export interface CreateOrderInput {
  email: string;
  customerName: string;
  phone?: string | null;
  shipping: CreateOrderShippingInput;
  items: CreateOrderItemInput[];
  /** Cupón ya validado server-side — opcional. */
  coupon?: OrderCoupon | null;
}

// ─── Reporting (panel admin · M3.2) ────────────────────────────

/** Resumen liviano de una orden — para listados del panel. */
export interface OrderSummary {
  id: string;
  number: number;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
}

/** Producto más vendido — agregado de los `OrderItem`. */
export interface TopProduct {
  productName: string;
  unitsSold: number;
  /** Ingresos generados por el producto, en centavos. */
  revenue: number;
}

/** Listado paginado de órdenes para el panel admin. */
export interface AdminOrderListResult {
  items: OrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Métricas del dashboard del panel admin. */
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  /** Ingresos en centavos — suma del total de las órdenes pagadas. */
  revenue: number;
  recentOrders: OrderSummary[];
  topProducts: TopProduct[];
}
