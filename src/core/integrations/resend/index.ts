/**
 * Integración Resend — API pública.
 *
 * Transporte de emails. Las plantillas concretas (confirmación de
 * pedido, pago, etc.) viven en `src/core/modules/notifications`.
 */
export { sendEmail, type SendEmailOptions } from "./send";
export { isEmailConfigured } from "./config";
