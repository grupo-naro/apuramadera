/**
 * Configuración de Resend.
 *
 * Reusa las variables de Auth.js (`AUTH_RESEND_KEY` / `AUTH_EMAIL_FROM`):
 * es la misma cuenta de Resend para el magic link y los emails
 * transaccionales — una env var menos al clonar una tienda.
 */
export const RESEND_API_KEY = process.env.AUTH_RESEND_KEY ?? "";
export const EMAIL_FROM = process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev";

export const isEmailConfigured = RESEND_API_KEY.length > 0;
