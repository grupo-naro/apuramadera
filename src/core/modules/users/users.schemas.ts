/**
 * Schemas Zod del módulo users.
 */
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Máximo 128 caracteres"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Las claves no coinciden",
    path: ["confirm"],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

/** DNI argentino: se guarda sólo con dígitos (7 a 9). */
const dniSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{7,9}$/, "DNI inválido (7 a 9 dígitos)"));

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Ingresá el nombre").max(80, "Máximo 80 caracteres"),
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
  dni: dniSchema,
});

export type CreateUserInput = z.input<typeof createUserSchema>;
