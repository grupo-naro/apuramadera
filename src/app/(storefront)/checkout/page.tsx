import type { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/core/lib/utils";
import { fetchCart } from "@/core/modules/cart";
import { buttonVariants } from "@/core/ui/button";
import { CheckoutForm } from "@/features/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const cart = await fetchCart();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Tu carrito está vacío — agregá productos para continuar.
        </p>
        <Link href="/productos" className={cn(buttonVariants(), "mt-6")}>
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Finalizar compra</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Completá tus datos para confirmar el pedido.
      </p>

      <div className="mt-8">
        <CheckoutForm cart={cart} />
      </div>
    </div>
  );
}
