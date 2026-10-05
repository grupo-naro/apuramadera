"use client";

/** Drawer (mini-cart) — se abre desde el botón del header. */
import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { buttonVariants } from "@/core/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/core/ui/sheet";

import { CartLineRow } from "./cart-line-row";
import { useCartStore } from "./cart-store";

export function CartDrawer() {
  const cart = useCartStore((state) => state.cart);
  const isOpen = useCartStore((state) => state.isOpen);
  const openCart = useCartStore((state) => state.openCart);
  const closeCart = useCartStore((state) => state.closeCart);

  const lines = cart?.lines ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>
            Tu carrito{cart && cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBagIcon className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tu carrito está vacío.
            </p>
            <Link
              href="/productos"
              onClick={closeCart}
              className={buttonVariants({ variant: "outline" })}
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-5">
                {lines.map((line) => (
                  <CartLineRow key={line.id} line={line} onNavigate={closeCart} />
                ))}
              </div>
            </div>

            <SheetFooter className="gap-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-base font-bold tabular-nums">
                  {formatPrice(cart?.subtotal ?? 0)}
                </span>
              </div>
              <Link
                href="/carrito"
                onClick={closeCart}
                className={buttonVariants({ size: "lg" })}
              >
                Ver carrito
              </Link>
              <p className="text-center text-xs text-muted-foreground">
                El envío se calcula en el checkout.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
