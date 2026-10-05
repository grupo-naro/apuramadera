"use client";

/** Botón del carrito en el header: ícono + contador, abre el drawer. */
import { ShoppingBagIcon } from "lucide-react";

import { useCartStore } from "./cart-store";

export function CartButton() {
  const itemCount = useCartStore((state) => state.cart?.itemCount ?? 0);
  const openCart = useCartStore((state) => state.openCart);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir carrito, ${itemCount} ${itemCount === 1 ? "ítem" : "ítems"}`}
      className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
    >
      <ShoppingBagIcon className="size-5" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}
