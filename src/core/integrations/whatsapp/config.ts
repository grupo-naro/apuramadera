/**
 * Configuración de WhatsApp.
 *
 * El número va en formato internacional sin `+` (ej. `5491123456789`).
 * Es `NEXT_PUBLIC_` porque lo necesita el botón flotante en el cliente.
 */
export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";

export const WHATSAPP_DEFAULT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ??
  "Hola, tengo una consulta sobre la tienda.";

export const isWhatsAppConfigured = WHATSAPP_PHONE.length > 0;
