import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon, ShoppingBagIcon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import {
  listAdminOrders,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "@/core/modules/orders";
import { buttonVariants } from "@/core/ui/button";
import { OrderStatusBadge } from "@/core/ui/commerce/order-status-badge";
import { Input } from "@/core/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";

export const metadata: Metadata = {
  title: "Órdenes",
  robots: { index: false },
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const sp = await searchParams;
  const result = await listAdminOrders(sp);

  /** URL del listado conservando los filtros, con otra página. */
  function pageUrl(page: number): string {
    const params = new URLSearchParams();
    if (sp.status) params.set("status", sp.status);
    if (sp.q) params.set("q", sp.q);
    params.set("page", String(page));
    return `/admin/ordenes?${params.toString()}`;
  }

  /** URL del export CSV con los filtros actuales aplicados. */
  function exportUrl(): string {
    const params = new URLSearchParams();
    if (sp.status) params.set("status", sp.status);
    if (sp.q) params.set("q", sp.q);
    const query = params.toString();
    return `/api/admin/ordenes/export${query ? `?${query}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Órdenes</h1>
          <p className="text-sm text-muted-foreground">
            {result.total === 0
              ? "Sin órdenes."
              : `${result.total} orden${result.total === 1 ? "" : "es"}.`}
          </p>
        </div>
        <a
          href={exportUrl()}
          className={buttonVariants({ variant: "outline" })}
        >
          <DownloadIcon className="size-4" />
          Exportar CSV
        </a>
      </div>

      {/* Filtros — formulario GET, sin JS */}
      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs text-muted-foreground">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={sp.status ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            <option value="">Todas</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-muted-foreground">
            Buscar
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="N° de orden, nombre o email"
            className="w-64"
          />
        </div>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Filtrar
        </button>
      </form>

      {result.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <ShoppingBagIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay órdenes que coincidan con el filtro.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium tabular-nums">
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="hover:underline"
                      >
                        #{order.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {order.customerName}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {result.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Página {result.page} de {result.totalPages}
              </span>
              <div className="flex gap-2">
                {result.page > 1 && (
                  <Link
                    href={pageUrl(result.page - 1)}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Anterior
                  </Link>
                )}
                {result.page < result.totalPages && (
                  <Link
                    href={pageUrl(result.page + 1)}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
