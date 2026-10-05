import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice } from "@/core/lib/format";
import { cn } from "@/core/lib/utils";
import { fetchCart } from "@/core/modules/cart";
import { buttonVariants } from "@/core/ui/button";
import { CartLineRow } from "@/features/cart/cart-line-row";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false },
};

export default async function CartPage() {
  const cart = await fetchCart();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Tu carrito</h1>
        <p className="mt-2 text-muted-foreground">
          Todavía no agregaste productos.
        </p>
        <Link href="/productos" className={cn(buttonVariants(), "mt-6")}>
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Tu carrito{" "}
        <span className="text-muted-foreground">({cart.itemCount})</span>
      </h1>

      <div className="mt-6 flex flex-col divide-y">
        {cart.lines.map((line) => (
          <div key={line.id} className="py-5 first:pt-0">
            <CartLineRow line={line} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-xl font-bold tabular-nums">
            {formatPrice(cart.subtotal)}
          </span>
        </div>
        <Link
          href="/checkout"
          className={cn(buttonVariants({ size: "lg" }), "sm:self-end")}
        >
          Finalizar compra
        </Link>
        <p className="text-right text-xs text-muted-foreground">
          El envío se calcula en el siguiente paso.
        </p>
      </div>
    </div>
  );
}
