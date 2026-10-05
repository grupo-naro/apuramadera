"use client";

/**
 * Store del carrito (Zustand).
 *
 * Caché de cliente del carrito + estado del drawer. La fuente de
 * verdad es la base: este store se hidrata y se actualiza con lo que
 * devuelven las Server Actions. Sin `persist` a propósito — persistir
 * en localStorage duplicaría (y desincronizaría) el carrito del server.
 */
import { create } from "zustand";

import type { Cart } from "@/core/modules/cart";

const EMPTY_CART: Cart = { id: null, lines: [], itemCount: 0, subtotal: 0 };

interface CartStore {
  cart: Cart | null;
  isOpen: boolean;
  setCart: (cart: Cart) => void;
  openCart: () => void;
  closeCart: () => void;
  /** Deja el carrito vacío en el cliente — tras confirmar el checkout. */
  resetCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  cart: null,
  isOpen: false,
  setCart: (cart) => set({ cart }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  resetCart: () => set({ cart: EMPTY_CART, isOpen: false }),
}));
