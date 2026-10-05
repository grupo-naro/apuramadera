import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { getCustomerByEmail } from "@/core/modules/customers/customers.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { OrderStatusBadge } from "@/core/ui/commerce/order-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";

export const metadata: Metadata = {
  title: "Detalle de cliente",
  robots: { index: false },
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface AdminCustomerPageProps {
  params: Promise<{ email: string }>;
}

export default async function AdminCustomerPage({
  params,
}: AdminCustomerPageProps) {
  const { email } = await params;
  const customer = await getCustomerByEmail(email);

  if (!customer) notFound();

  const stats = [
    { label: "Pedidos", value: String(customer.orderCount) },
    { label: "Total", value: formatPrice(customer.totalSpent) },
    {
      label: "Primer pedido",
      value: dateFormatter.format(customer.firstOrderAt),
    },
    {
      label: "Último pedido",
      value: dateFormatter.format(customer.lastOrderAt),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/clientes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Clientes
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {customer.name}
        </h1>
        <p className="text-sm text-muted-foreground">{customer.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium tabular-nums">
                    <Link
                      href={`/admin/ordenes/${order.id}`}
                      className="hover:underline"
                    >
                      #{order.number}
                    </Link>
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
        </CardContent>
      </Card>
    </div>
  );
}
