/**
 * Allowlist de administradores.
 *
 * Quién puede entrar al panel se define por la variable de entorno
 * `ADMIN_EMAILS` (emails separados por coma) — NO por una columna en
 * la base. Así, clonar una tienda para un cliente es sólo cambiar esa
 * variable; no hay estado de roles que migrar.
 */
const ADMIN_EMAILS: readonly string[] = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/** ¿El email tiene acceso al panel admin? Comparación case-insensitive. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
