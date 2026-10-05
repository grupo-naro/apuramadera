import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { getOrderById } from "@/core/modules/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { OrderStatusBadge } from "@/core/ui/commerce/order-status-badge";
import { StoreImage } from "@/core/ui/store-image";
import { OrderStatusManager } from "@/features/admin/order-status-manager";

export const metadata: Metadata = {
  title: "Detalle de orden",
  robots: { index: false },
};

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const dateLabel = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(order.createdAt);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/ordenes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Órdenes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Orden #{order.number}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Ítems */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col divide-y">
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
                      <span className="text-sm font-medium leading-snug">
                        {item.productName}
                      </span>
                      {item.variantName && (
                        <span className="text-xs text-muted-foreground">
                          {item.variantName}
                        </span>
                      )}
                      {item.sku && (
                        <span className="text-xs text-muted-foreground">
                          SKU {item.sku}
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
                  <span className="tabular-nums">
                    {formatPrice(order.subtotal)}
                  </span>
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
                  <span className="tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacto y envío */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{order.customerName}</span>
                <span className="text-muted-foreground">{order.email}</span>
                {order.phone && (
                  <span className="text-muted-foreground">{order.phone}</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Envío</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{order.shipping.method}</span>
                {order.shipping.street ? (
                  <span className="text-muted-foreground">
                    {order.shipping.recipient && (
                      <>
                        {order.shipping.recipient}
                        <br />
                      </>
                    )}
                    {order.shipping.street}
                    {order.shipping.apartment &&
                      `, ${order.shipping.apartment}`}
                    <br />
                    {order.shipping.city}, {order.shipping.province} (
                    {order.shipping.postalCode})
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Retiro en el local.
                  </span>
                )}
                {order.shipping.notes && (
                  <span className="mt-1 text-muted-foreground">
                    Nota: {order.shipping.notes}
                  </span>
                )}
              </CardContent>
            </Card>
          </div>

          {order.paymentId && (
            <p className="text-xs text-muted-foreground">
              ID de pago (Mercado Pago): {order.paymentId}
            </p>
          )}
        </div>

        {/* Gestión */}
        <OrderStatusManager
          orderId={order.id}
          currentStatus={order.status}
          trackingCode={order.trackingCode ?? ""}
        />
      </div>
    </div>
  );
}
