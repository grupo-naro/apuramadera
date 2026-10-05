import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2Icon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { cn } from "@/core/lib/utils";
import { getOrderById } from "@/core/modules/orders";
import { buttonVariants } from "@/core/ui/button";
import { OrderStatusBadge } from "@/core/ui/commerce/order-status-badge";
import { StoreImage } from "@/core/ui/store-image";
import { PurchaseTracker } from "@/features/storefront/purchase-tracker";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false },
};

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const dateLabel = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
  }).format(order.createdAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <PurchaseTracker
        orderId={order.id}
        status={order.status}
        value={order.total}
        shippingCost={order.shipping.cost}
        items={order.items.map((item) => ({
          productId: item.productId ?? item.id,
          name: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        }))}
      />

      {/* ─── Cabecera ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center">
        <CheckCircle2Icon className="size-12 text-primary" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          ¡Gracias por tu compra!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tu pedido <span className="font-semibold">#{order.number}</span> se
          registró el {dateLabel}.
        </p>
        <div className="mt-3">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* ─── Ítems ─────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Productos
        </h2>
        <ul className="mt-3 flex flex-col divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                {item.imagePublicId && (
                  <StoreImage
                    src={item.imagePublicId}
                    alt={item.productName}
                    preset="thumbnail"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="line-clamp-2 text-sm font-medium leading-snug">
                  {item.productName}
                </span>
                {item.variantName && (
                  <span className="text-xs text-muted-foreground">
                    {item.variantName}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatPrice(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Envío · {order.shipping.method}
            </span>
            <span className="tabular-nums">
              {order.shipping.cost === 0
                ? "Gratis"
                : formatPrice(order.shipping.cost)}
            </span>
          </div>
          {order.coupon && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Cupón · {order.coupon.code}
              </span>
              <span className="tabular-nums text-emerald-700">
                -{formatPrice(order.coupon.discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* ─── Datos de envío / contacto ─────────────────────────── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Contacto
          </h2>
          <div className="mt-2 flex flex-col text-sm">
            <span>{order.customerName}</span>
            <span className="text-muted-foreground">{order.email}</span>
            {order.phone && (
              <span className="text-muted-foreground">{order.phone}</span>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Envío</h2>
          <div className="mt-2 flex flex-col text-sm">
            <span>{order.shipping.method}</span>
            {order.shipping.street ? (
              <span className="text-muted-foreground">
                {order.shipping.street}
                {order.shipping.apartment && `, ${order.shipping.apartment}`}
                {" — "}
                {order.shipping.city}, {order.shipping.province} (
                {order.shipping.postalCode})
              </span>
            ) : (
              <span className="text-muted-foreground">Retiro en el local.</span>
            )}
            {order.shipping.notes && (
              <span className="mt-1 text-muted-foreground">
                Nota: {order.shipping.notes}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/productos" className={cn(buttonVariants({ variant: "outline" }))}>
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
