/** Fila de `User` con lo necesario para autenticar. */
export interface AuthUserRecord {
  id: string;
  email: string;
  name: string | null;
  dni: string | null;
  passwordHash: string | null;
  mustChangePassword: boolean;
  failedLogins: number;
  lockedUntil: Date | null;
}

/** Usuario del panel tal como se lista en `/admin/usuarios`. */
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  dni: string | null;
  mustChangePassword: boolean;
  /** Email en `ADMIN_EMAILS`: no se puede eliminar. */
  isPrincipal: boolean;
  createdAt: Date;
}

/** Lo que `authorize` de Auth.js devuelve al loguearse bien. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  mustChangePassword: boolean;
}
