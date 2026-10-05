/**
 * Módulo Cupones — API pública.
 *
 * Fase 6 · M6.3 — cupones de descuento. El checkout (`submitCheckout`)
 * usa `validateCoupon` para revalidar server-side; el repo expone
 * `tryIncrementUsage` para que `createOrder` lo invoque dentro de su
 * transacción.
 */
export {
  applyCouponAction,
  deleteCouponAction,
  saveCouponAction,
  type SaveCouponResult,
} from "./coupons.actions";
export {
  COUPON_TYPE_LABELS,
  COUPON_TYPES,
  couponFormSchema,
  type ApplyCouponInput,
  type CouponFormInput,
  type CouponType,
} from "./coupons.schemas";
export {
  getCouponById,
  getCouponForEdit,
  listAdminCoupons,
  validateCoupon,
} from "./coupons.use-cases";
export type {
  Coupon,
  CouponSummary,
  ValidateCouponResult,
  ValidatedCoupon,
} from "./coupons.types";
