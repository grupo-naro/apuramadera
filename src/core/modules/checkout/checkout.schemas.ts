/**
 * Validación del formulario de checkout (Zod).
 *
 * El mismo schema valida en el cliente (React Hook Form) y en el
 * servidor (`submitCheckout`). La dirección de envío sólo es
 * obligatoria si el método elegido es a domicilio.
 */
import { z } from "zod";

import { findShippingMethod } from "@/core/modules/shipping";

export const checkoutSchema = z
  .object({
    email: z.string().min(1, "Ingresá tu email").email("Email inválido"),
    customerName: z.string().min(1, "Ingresá tu nombre"),
    phone: z.string().optional(),
    shippingMethodId: z.string().min(1, "Elegí un método de envío"),
    // Dirección — obligatoria sólo para envío a domicilio.
    recipient: z.string().optional(),
    street: z.string().optional(),
    apartment: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    notes: z.string().optional(),
    /** Código de cupón aplicado — se RE-valida server-side. */
    couponCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const method = findShippingMethod(data.shippingMethodId);
    if (!method) {
      ctx.addIssue({
        code: "custom",
        path: ["shippingMethodId"],
        message: "Método de envío inválido",
      });
      return;
    }
    if (method.kind === "delivery") {
      const required = [
        ["street", "la calle y la altura"],
        ["city", "la localidad"],
        ["province", "la provincia"],
        ["postalCode", "el código postal"],
      ] as const;
      for (const [field, label] of required) {
        if (!data[field]?.trim()) {
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `Ingresá ${label}`,
          });
        }
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
