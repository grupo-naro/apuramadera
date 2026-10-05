/**
 * Configuración de Mercado Pago (M2.5).
 *
 * `MP_CLIENT_ID` / `MP_CLIENT_SECRET` son de la aplicación de la
 * AGENCIA — son iguales en todos los clones. Lo que cambia por
 * tienda son los tokens que se obtienen vía OAuth (ver
 * `PaymentConnection`).
 *
 * `MP_REDIRECT_URI` se deriva del dominio del sitio: al clonar una
 * tienda, alcanza con registrar esa URL en la app de MP.
 */
export const MP_CLIENT_ID = process.env.MP_CLIENT_ID ?? "";
export const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET ?? "";

export const MP_API_BASE = "https://api.mercadopago.com";
export const MP_AUTHORIZE_URL =
  "https://auth.mercadopago.com.ar/authorization";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Callback del OAuth — debe estar registrado en la app de MP. */
export const MP_REDIRECT_URI = `${SITE_URL}/api/payments/mercadopago/callback`;

/** URL del webhook donde MP notifica los pagos. */
export const MP_WEBHOOK_URL = `${SITE_URL}/api/webhooks/mercadopago`;

export const isMercadoPagoConfigured =
  MP_CLIENT_ID !== "" && MP_CLIENT_SECRET !== "";
