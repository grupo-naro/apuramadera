import type { Metadata } from "next";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  ClockIcon,
  type LucideIcon,
  ShoppingBagIcon,
} from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { getDashboardStats } from "@/core/modules/orders";
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
  title: "Dashboard",
  robots: { index: false },
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de la actividad de la tienda.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={formatPrice(stats.revenue)}
          hint="Órdenes pagadas"
          icon={BanknoteIcon}
        />
        <StatCard
          label="Órdenes"
          value={String(stats.totalOrders)}
          hint="Total histórico"
          icon={ShoppingBagIcon}
        />
        <StatCard
          label="Pendientes"
          value={String(stats.pendingOrders)}
          hint="Esperando pago"
          icon={ClockIcon}
        />
        <StatCard
          label="Pagadas"
          value={String(stats.paidOrders)}
          hint="Con pago confirmado"
          icon={CheckCircle2Icon}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Órdenes recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no hay órdenes.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium tabular-nums">
                        #{order.number}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate">
                        {order.customerName}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no hay ventas.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProducts.map((product) => (
                    <TableRow key={product.productName}>
                      <TableCell className="max-w-[12rem] truncate font-medium">
                        {product.productName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.unitsSold}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
