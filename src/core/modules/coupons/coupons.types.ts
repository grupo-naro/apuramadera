/**
 * Tipos de dominio de los cupones.
 *
 * Dinero en centavos. `type=PERCENTAGE` → `value` es el porcentaje
 * entero (1-100); `type=FIXED_AMOUNT` → `value` es el monto en
 * centavos a descontar del subtotal.
 */
import type { CouponType } from "./coupons.schemas";

export type { CouponType };

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  description: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  /** Subtotal mínimo (centavos) para que aplique el cupón. */
  minSubtotal: number | null;
  /** Cupo global de usos — null = ilimitado. */
  usageLimit: number | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cupón ya validado contra un subtotal — listo para pegar en la orden.
 * `discount` es el monto efectivo a restar del subtotal (centavos).
 */
export interface ValidatedCoupon {
  id: string;
  code: string;
  discount: number;
  description: string | null;
}

/** Resultado de validar un cupón contra un subtotal. */
export type ValidateCouponResult =
  | { ok: true; coupon: ValidatedCoupon }
  | { ok: false; error: string };

/** Resumen de un cupón para el listado del panel admin. */
export interface CouponSummary {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
}
