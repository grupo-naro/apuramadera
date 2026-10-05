"use client";

/**
 * Hidrata el store del carrito al montar la app (lee el carrito del
 * server vía Server Action). No renderiza nada.
 */
import { useEffect } from "react";

import { fetchCart } from "@/core/modules/cart";

import { useCartStore } from "./cart-store";

export function CartProvider() {
  const setCart = useCartStore((state) => state.setCart);

  useEffect(() => {
    fetchCart()
      .then(setCart)
      .catch(() => {
        // Si falla la hidratación, el carrito queda vacío hasta la
        // próxima acción — no es bloqueante.
      });
  }, [setCart]);

  return null;
}
