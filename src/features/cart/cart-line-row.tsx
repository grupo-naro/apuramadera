"use client";

/**
 * Línea del carrito: imagen, nombre, stepper de cantidad y total.
 * Se usa tanto en el drawer como en la página /carrito.
 */
import { useTransition } from "react";
import Link from "next/link";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { cn } from "@/core/lib/utils";
import {
  removeFromCart,
  updateCartItem,
  type CartLine,
} from "@/core/modules/cart";
import { StoreImage } from "@/core/ui/store-image";

import { useCartStore } from "./cart-store";

interface CartLineRowProps {
  line: CartLine;
  /** Callback al navegar (ej. cerrar el drawer). */
  onNavigate?: () => void;
}

export function CartLineRow({ line, onNavigate }: CartLineRowProps) {
  const setCart = useCartStore((state) => state.setCart);
  const [pending, startTransition] = useTransition();

  function setQuantity(quantity: number) {
    startTransition(async () => {
      setCart(await updateCartItem(line.variantId, quantity));
    });
  }

  function remove() {
    startTransition(async () => {
      setCart(await removeFromCart(line.variantId));
    });
  }

  const atMax = line.quantity >= line.stock;

  return (
    <div className={cn("flex gap-3", pending && "opacity-60")}>
      <Link
        href={`/productos/${line.productSlug}`}
        onClick={onNavigate}
        className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border bg-muted"
      >
        {line.imagePublicId && (
          <StoreImage
            src={line.imagePublicId}
            alt={line.imageAlt ?? line.productName}
            preset="thumbnail"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/productos/${line.productSlug}`}
          onClick={onNavigate}
          className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
        >
          {line.productName}
        </Link>
        {line.variantName && (
          <span className="text-xs text-muted-foreground">
            {line.variantName}
          </span>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center rounded-md border">
            <button
              type="button"
              aria-label="Quitar una unidad"
              disabled={pending}
              onClick={() => setQuantity(line.quantity - 1)}
              className="grid size-7 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <MinusIcon className="size-3.5" />
            </button>
            <span className="w-7 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Agregar una unidad"
              disabled={pending || atMax}
              onClick={() => setQuantity(line.quantity + 1)}
              className="grid size-7 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <PlusIcon className="size-3.5" />
            </button>
          </div>

          <span className="text-sm font-semibold tabular-nums">
            {formatPrice(line.lineTotal)}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label="Eliminar del carrito"
        disabled={pending}
        onClick={remove}
        className="self-start text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
      >
        <Trash2Icon className="size-4" />
      </button>
    </div>
  );
}
