/**
 * Use cases de cupones.
 *
 * `validateCoupon` es la lógica de negocio principal — la usa el
 * checkout para previsualizar el descuento y RE-validar al confirmar.
 * NO incrementa `usageCount`: eso lo hace `tryIncrementUsage` dentro
 * de la transacción de `createOrder` (módulo orders).
 */
import { formatPrice } from "@/core/lib/format";

import * as repo from "./coupons.repository";
import type { CouponFormInput } from "./coupons.schemas";
import type { Coupon, ValidateCouponResult } from "./coupons.types";

/**
 * Calcula el descuento (en centavos) que aplica el cupón sobre el
 * subtotal. Topea en el subtotal para evitar descuentos negativos.
 */
function computeDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === "PERCENTAGE") {
    const raw = Math.round((subtotal * coupon.value) / 100);
    return Math.min(subtotal, raw);
  }
  return Math.min(subtotal, coupon.value);
}

/**
 * Valida un código de cupón contra un subtotal y devuelve el
 * descuento aplicable. Mensajes de error pensados para mostrar
 * directo al cliente — sin filtrar info sensible.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<ValidateCouponResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, error: "Ingresá un código." };
  }

  const coupon = await repo.findCouponByCode(normalized);
  if (!coupon) return { ok: false, error: "Cupón inválido." };
  if (!coupon.isActive) {
    return { ok: false, error: "Este cupón no está activo." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, error: "Este cupón todavía no está vigente." };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, error: "Este cupón está vencido." };
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, error: "Este cupón ya alcanzó su cupo de usos." };
  }
  if (coupon.minSubtotal !== null && subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      error: `Este cupón requiere un subtotal mínimo de ${formatPrice(coupon.minSubtotal)}.`,
    };
  }

  const discount = computeDiscount(coupon, subtotal);
  if (discount <= 0) {
    return { ok: false, error: "Este cupón no aplica a tu pedido." };
  }

  return {
    ok: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount,
      description: coupon.description,
    },
  };
}

// ─── Use cases del panel admin ─────────────────────────────────

export async function listAdminCoupons() {
  return repo.listAdminCoupons();
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  if (!id.trim()) return null;
  return repo.findCouponById(id);
}

/** Date → "YYYY-MM-DDTHH:mm" (formato del input `datetime-local`). */
function toDateTimeLocal(date: Date | null): string {
  if (!date) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/**
 * Devuelve un cupón ya mapeado a los strings del formulario. La action
 * volverá a parsear todo a centavos/Date al guardar.
 */
export async function getCouponForEdit(
  id: string,
): Promise<(CouponFormInput & { id: string }) | null> {
  const coupon = await repo.findCouponById(id);
  if (!coupon) return null;

  const value =
    coupon.type === "PERCENTAGE"
      ? String(coupon.value)
      : String(coupon.value / 100);

  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value,
    description: coupon.description ?? "",
    isActive: coupon.isActive,
    startsAt: toDateTimeLocal(coupon.startsAt),
    endsAt: toDateTimeLocal(coupon.endsAt),
    minSubtotal:
      coupon.minSubtotal !== null ? String(coupon.minSubtotal / 100) : "",
    usageLimit: coupon.usageLimit !== null ? String(coupon.usageLimit) : "",
  };
}
