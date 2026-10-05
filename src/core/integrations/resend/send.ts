/**
 * Envío de emails vía la API de Resend.
 */
import { EMAIL_FROM, isEmailConfigured, RESEND_API_KEY } from "./config";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envía un email. Si Resend no está configurado, sólo avisa por
 * consola (no rompe — útil en desarrollo). Lanza si la API falla.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!isEmailConfigured) {
    console.warn(
      `Email no enviado (Resend sin configurar): "${options.subject}"`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend falló (${response.status}): ${detail}`);
  }
}
