"use server";

/**
 * Server actions del módulo coupons.
 *
 * `applyCouponAction` es pública — la usa el checkout para
 * PREVISUALIZAR el descuento; el monto real se RE-valida server-side
 * en `submitCheckout` con el subtotal recalculado.
 *
 * `saveCouponAction`/`deleteCouponAction` son del panel admin
 * (`/admin/*` ya pasa por el proxy de auth).
 */
import { revalidatePath } from "next/cache";

import { fetchCart } from "@/core/modules/cart";

import {
  createCoupon,
  deleteCoupon,
  updateCoupon,
  type SaveCouponData,
} from "./coupons.repository";
import { couponFormSchema, type CouponFormInput } from "./coupons.schemas";
import type { ValidateCouponResult } from "./coupons.types";
import { validateCoupon } from "./coupons.use-cases";

// ─── Pública (storefront) ─────────────────────────────────────

/**
 * Aplica un cupón a tu carrito y devuelve el descuento aplicable.
 * El subtotal lo lee del CART real (cookie httpOnly) — no del cliente.
 */
export async function applyCouponAction(
  code: string,
): Promise<ValidateCouponResult> {
  const cart = await fetchCart();
  if (cart.lines.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }
  return validateCoupon(code, cart.subtotal);
}

// ─── Admin ────────────────────────────────────────────────────

export type SaveCouponResult =
  | { ok: true; id: string }
  | { ok: false; error: string; field?: "code" };

/** Pesos enteros → centavos. */
const toCentavos = (pesos: string) => Number(pesos) * 100;

/** `datetime-local` ("YYYY-MM-DDTHH:mm") → Date | null. */
function parseDateTimeLocal(value: string | undefined): Date | null {
  if (!value || value.trim() === "") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function toSaveData(input: CouponFormInput): SaveCouponData {
  const value =
    input.type === "PERCENTAGE"
      ? Number(input.value)
      : toCentavos(input.value);

  return {
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value,
    description: input.description?.trim() || null,
    isActive: input.isActive,
    startsAt: parseDateTimeLocal(input.startsAt),
    endsAt: parseDateTimeLocal(input.endsAt),
    minSubtotal:
      input.minSubtotal && input.minSubtotal.trim() !== ""
        ? toCentavos(input.minSubtotal)
        : null,
    usageLimit:
      input.usageLimit && input.usageLimit.trim() !== ""
        ? Number(input.usageLimit)
        : null,
  };
}

function isUniqueCodeViolation(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    (error as { code: unknown }).code !== "P2002"
  ) {
    return false;
  }
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  const fields = (Array.isArray(target) ? target : [target]).map(String);
  return fields.some((f) => f.includes("code"));
}

export async function saveCouponAction(
  couponId: string | null,
  input: unknown,
): Promise<SaveCouponResult> {
  const parsed = couponFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los datos del formulario." };
  }
  const data = toSaveData(parsed.data);

  try {
    const coupon = couponId
      ? await updateCoupon(couponId, data)
      : await createCoupon(data);
    revalidatePath("/admin/cupones");
    return { ok: true, id: coupon.id };
  } catch (error) {
    if (isUniqueCodeViolation(error)) {
      return {
        ok: false,
        error: "Ya existe un cupón con ese código.",
        field: "code",
      };
    }
    throw error;
  }
}

export async function deleteCouponAction(
  couponId: string,
): Promise<{ ok: true }> {
  await deleteCoupon(couponId);
  revalidatePath("/admin/cupones");
  return { ok: true };
}
