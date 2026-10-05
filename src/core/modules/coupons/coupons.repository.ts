/**
 * Repositorio de cupones — única capa que habla con Prisma.
 *
 * `tryIncrementUsage` se llama dentro de la transacción de
 * `createOrder` (módulo orders): usa SQL raw con un guard atómico
 * sobre `usageLimit` para evitar pasarse del cupo por race condition.
 */
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/core/lib/db";

import type { Coupon, CouponSummary, CouponType } from "./coupons.types";

type CouponRow = Prisma.CouponGetPayload<true>;

function toCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    description: row.description,
    isActive: row.isActive,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    minSubtotal: row.minSubtotal,
    usageLimit: row.usageLimit,
    usageCount: row.usageCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Lectura pública (storefront) ──────────────────────────────

/** Lookup case-insensitive por código (lo normalizamos a uppercase). */
export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const row = await prisma.coupon.findUnique({ where: { code: normalized } });
  return row ? toCoupon(row) : null;
}

// ─── Admin: listado + CRUD ─────────────────────────────────────

const couponSummarySelect = {
  id: true,
  code: true,
  type: true,
  value: true,
  isActive: true,
  startsAt: true,
  endsAt: true,
  usageLimit: true,
  usageCount: true,
} satisfies Prisma.CouponSelect;

export async function listAdminCoupons(): Promise<CouponSummary[]> {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    select: couponSummarySelect,
  });
}

export async function findCouponById(id: string): Promise<Coupon | null> {
  const row = await prisma.coupon.findUnique({ where: { id } });
  return row ? toCoupon(row) : null;
}

export interface SaveCouponData {
  code: string;
  type: CouponType;
  value: number;
  description: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotal: number | null;
  usageLimit: number | null;
}

export async function createCoupon(data: SaveCouponData): Promise<Coupon> {
  const row = await prisma.coupon.create({ data });
  return toCoupon(row);
}

export async function updateCoupon(
  id: string,
  data: SaveCouponData,
): Promise<Coupon> {
  const row = await prisma.coupon.update({ where: { id }, data });
  return toCoupon(row);
}

export async function deleteCoupon(id: string): Promise<void> {
  await prisma.coupon.delete({ where: { id } });
}

// ─── Incremento atómico de uso ─────────────────────────────────

/**
 * Incrementa `usageCount` SI el cupón sigue activo y no se pasó del
 * cupo. Atómico — el guard `usageCount < usageLimit` va en el WHERE
 * del UPDATE, así dos clientes en simultáneo no superan el límite.
 * Devuelve `true` si se incrementó (la orden puede aplicarlo).
 *
 * Se ejecuta dentro de la `$transaction` que crea la orden — recibe
 * el cliente transaccional para que un rollback cancele también esto.
 */
export async function tryIncrementUsage(
  tx: Prisma.TransactionClient,
  couponId: string,
): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "Coupon"
    SET "usageCount" = "usageCount" + 1, "updatedAt" = NOW()
    WHERE "id" = ${couponId}
      AND "isActive" = true
      AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")
  `;
  return affected === 1;
}
