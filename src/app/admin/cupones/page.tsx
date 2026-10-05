import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, TicketIcon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { listAdminCoupons } from "@/core/modules/coupons";
import { Badge } from "@/core/ui/badge";
import { buttonVariants } from "@/core/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";

export const metadata: Metadata = {
  title: "Cupones",
  robots: { index: false },
};

function formatValue(
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  value: number,
): string {
  return type === "PERCENTAGE" ? `${value}%` : formatPrice(value);
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(date);
}

export default async function AdminCouponsPage() {
  const coupons = await listAdminCoupons();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cupones</h1>
          <p className="text-sm text-muted-foreground">
            {coupons.length === 0
              ? "Sin cupones todavía."
              : `${coupons.length} cupón${coupons.length === 1 ? "" : "es"}.`}
          </p>
        </div>
        <Link href="/admin/cupones/nuevo" className={buttonVariants()}>
          <PlusIcon className="size-4" />
          Nuevo cupón
        </Link>
      </div>

      {coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <TicketIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Generá descuentos para tus campañas.
          </p>
          <Link
            href="/admin/cupones/nuevo"
            className={buttonVariants({ variant: "outline" })}
          >
            <PlusIcon className="size-4" />
            Nuevo cupón
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <Link
                      href={`/admin/cupones/${coupon.id}`}
                      className="font-mono font-medium hover:underline"
                    >
                      {coupon.code}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatValue(coupon.type, coupon.value)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(coupon.startsAt)} → {formatDate(coupon.endsAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {coupon.usageCount}
                    {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? "default" : "outline"}>
                      {coupon.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
