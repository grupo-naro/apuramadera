/**
 * Botón flotante de WhatsApp — fijo abajo a la derecha en todo el
 * storefront. Si no hay número configurado, no se renderiza.
 */
import { MessageCircleIcon } from "lucide-react";

import {
  buildWhatsAppUrl,
  isWhatsAppConfigured,
  WHATSAPP_DEFAULT_MESSAGE,
} from "@/core/integrations/whatsapp";

export function WhatsAppButton() {
  if (!isWhatsAppConfigured) return null;

  return (
    <a
      href={buildWhatsAppUrl(WHATSAPP_DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:right-6 sm:bottom-6 sm:size-14"
    >
      <MessageCircleIcon className="size-6 sm:size-7" />
    </a>
  );
}
