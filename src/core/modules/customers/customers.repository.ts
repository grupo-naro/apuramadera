/**
 * Repositorio de clientes — agrega las órdenes por email.
 *
 * Como no hay tabla `Customer`, el listado se arma en memoria a
 * partir de todas las órdenes. Para catálogos de órdenes muy grandes
 * convendría denormalizar; para el volumen de una tienda PyME es
 * más que suficiente.
 */
import { prisma } from "@/core/lib/db";
import type { OrderSummary } from "@/core/modules/orders";

import type { CustomerDetail, CustomerSummary } from "./customers.types";

/** Lista de clientes (orden: pedido más reciente primero). */
export async function listCustomers(
  search?: string,
): Promise<CustomerSummary[]> {
  // Más nuevas primero: la primera vez que aparece un email es su
  // pedido más reciente → de ahí salen `name` y `lastOrderAt`.
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, customerName: true, total: true, createdAt: true },
  });

  const byEmail = new Map<string, CustomerSummary>();
  for (const row of rows) {
    const key = row.email.toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += row.total;
    } else {
      byEmail.set(key, {
        email: row.email,
        name: row.customerName,
        orderCount: 1,
        totalSpent: row.total,
        lastOrderAt: row.createdAt,
      });
    }
  }

  const customers = [...byEmail.values()];
  const term = search?.trim().toLowerCase();
  if (!term) return customers;
  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term),
  );
}

/** Cliente por email, con su historial. `null` si no tiene pedidos. */
export async function getCustomerByEmail(
  email: string,
): Promise<CustomerDetail | null> {
  const rows = await prisma.order.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      customerName: true,
      status: true,
      total: true,
      createdAt: true,
      email: true,
    },
  });
  if (rows.length === 0) return null;

  const orders: OrderSummary[] = rows.map((row) => ({
    id: row.id,
    number: row.number,
    customerName: row.customerName,
    status: row.status,
    total: row.total,
    createdAt: row.createdAt,
  }));

  return {
    email: rows[0].email,
    name: rows[0].customerName,
    orderCount: rows.length,
    totalSpent: rows.reduce((sum, row) => sum + row.total, 0),
    firstOrderAt: rows[rows.length - 1].createdAt,
    lastOrderAt: rows[0].createdAt,
    orders,
  };
}
