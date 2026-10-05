import type { Metadata } from "next";
import Link from "next/link";
import { UsersIcon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { listCustomers } from "@/core/modules/customers/customers.repository";
import { buttonVariants } from "@/core/ui/button";
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
  title: "Clientes",
  robots: { index: false },
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface AdminCustomersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length === 0
            ? "Sin clientes todavía."
            : `${customers.length} cliente${customers.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      <form className="flex items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-muted-foreground">
            Buscar
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nombre o email"
            className="w-64"
          />
        </div>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Buscar
        </button>
      </form>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <UsersIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {q
              ? "Ningún cliente coincide con la búsqueda."
              : "Los clientes aparecen acá cuando se registran pedidos."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Último pedido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.email}>
                  <TableCell>
                    <Link
                      href={`/admin/clientes/${encodeURIComponent(customer.email)}`}
                      className="block"
                    >
                      <span className="font-medium hover:underline">
                        {customer.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {customer.email}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {customer.orderCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFormatter.format(customer.lastOrderAt)}
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
