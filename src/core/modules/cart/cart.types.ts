/**
 * Tipos de dominio del carrito.
 *
 * El carrito muestra precio VIVO (el de la variante hoy). El snapshot
 * de precio se toma recién al crear la orden (M2.3). Dinero en centavos.
 */

/** Una línea del carrito: una variante con su cantidad. */
export interface CartLine {
  /** id del CartItem. */
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  /** Nombre de la variante ("Negro / M"), o null si es producto simple. */
  variantName: string | null;
  sku: string | null;
  imagePublicId: string | null;
  imageAlt: string | null;
  /** Precio unitario en centavos. */
  unitPrice: number;
  quantity: number;
  /** unitPrice × quantity. */
  lineTotal: number;
  /** Stock disponible de la variante — tope de cantidad. */
  stock: number;
  inStock: boolean;
}

export interface Cart {
  /** id del carrito, o null si todavía no se creó (carrito vacío). */
  id: string | null;
  lines: CartLine[];
  /** Suma de cantidades. */
  itemCount: number;
  /** Suma de los totales de línea, en centavos. */
  subtotal: number;
}
