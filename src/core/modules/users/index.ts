/**
 * Módulo Users — API pública.
 *
 * Usuarios del panel admin: contraseñas, alta/baja y cambio de clave.
 * La verificación de credenciales del login vive en
 * `users.credentials.ts` (la importa `core/auth/auth.ts` directo).
 */
export {
  changePasswordAction,
  createUserAction,
  deleteUserAction,
} from "./users.actions";
export {
  changePasswordSchema,
  createUserSchema,
  type ChangePasswordInput,
  type CreateUserInput,
} from "./users.schemas";
export { isActiveAdmin, listAdminUsers } from "./users.use-cases";
export type { CreateUserResult } from "./users.use-cases";
export type { AdminUser } from "./users.types";
