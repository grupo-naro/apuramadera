/**
 * Helpers para armar la URL de wa.me.
 */
import { WHATSAPP_PHONE } from "./config";

/** URL `https://wa.me/...` con el mensaje URL-encoded. */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
