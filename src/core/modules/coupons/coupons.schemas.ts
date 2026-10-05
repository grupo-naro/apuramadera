/**
 * Schemas Zod del módulo coupons.
 *
 * El formulario del panel manda todos los campos como string (RHF +
 * inputs nativos). El parsing a centavos/Date se hace en la action.
 */
import { z } from "zod";

/**
 * Mismo orden y valores que el enum `CouponType` del schema Prisma —
 * declarado acá para que el schema sea SAFE de importar desde un
 * componente cliente (no arrastra `@/generated/prisma`).
 */
export const COUPON_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  PERCENTAGE: "Porcentaje",
  FIXED_AMOUNT: "Monto fijo",
};

/** Form admin — strings que después la action castea/normaliza. */
export const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(1, "Ingresá un código")
      .max(40, "Máximo 40 caracteres")
      .regex(/^[A-Za-z0-9_-]+$/, "Sólo letras, números, `_` y `-`"),
    type: z.enum(COUPON_TYPES),
    /** Porcentaje (1-100) o pesos enteros — se interpreta según `type`. */
    value: z.string().min(1, "Ingresá un valor"),
    description: z.string().optional(),
    isActive: z.boolean(),
    /** `datetime-local` (`YYYY-MM-DDTHH:mm`) o vacío. */
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    /** Subtotal mínimo en pesos enteros — vacío = sin mínimo. */
    minSubtotal: z.string().optional(),
    /** Cupo total — vacío = ilimitado. */
    usageLimit: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const value = Number(data.value);
    if (!Number.isFinite(value) || value <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Valor inválido",
      });
    } else if (data.type === "PERCENTAGE" && (value < 1 || value > 100)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "El porcentaje debe estar entre 1 y 100",
      });
    }
    if (data.minSubtotal && data.minSubtotal.trim() !== "") {
      const min = Number(data.minSubtotal);
      if (!Number.isFinite(min) || min < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["minSubtotal"],
          message: "Valor inválido",
        });
      }
    }
    if (data.usageLimit && data.usageLimit.trim() !== "") {
      const limit = Number(data.usageLimit);
      if (!Number.isInteger(limit) || limit < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["usageLimit"],
          message: "Debe ser un entero positivo",
        });
      }
    }
    if (data.startsAt && data.endsAt) {
      const a = new Date(data.startsAt).getTime();
      const b = new Date(data.endsAt).getTime();
      if (Number.isFinite(a) && Number.isFinite(b) && a > b) {
        ctx.addIssue({
          code: "custom",
          path: ["endsAt"],
          message: "La fecha de fin debe ser posterior a la de inicio",
        });
      }
    }
  });

export type CouponFormInput = z.infer<typeof couponFormSchema>;

/** Input público — el cliente lo manda para aplicar un cupón. */
export const applyCouponSchema = z.object({
  code: z.string().min(1, "Ingresá un código"),
  /** Subtotal del carrito en centavos. */
  subtotal: z.number().int().nonnegative(),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
