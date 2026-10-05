/**
 * Cliente HTTP de Mercado Pago — OAuth, preferencias de pago y
 * consulta de pagos. Llamadas REST crudas con `fetch`.
 */
import {
  MP_API_BASE,
  MP_CLIENT_ID,
  MP_CLIENT_SECRET,
  MP_REDIRECT_URI,
} from "./payments.config";

/** Respuesta del endpoint de tokens de Mercado Pago. */
export interface MpTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  public_key: string;
  scope?: string;
}

async function requestToken(
  body: Record<string, string>,
): Promise<MpTokenResponse> {
  const response = await fetch(`${MP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Mercado Pago OAuth falló (${response.status}): ${detail}`,
    );
  }
  return (await response.json()) as MpTokenResponse;
}

/**
 * Canjea el `code` del callback OAuth por el par de tokens.
 *
 * Mercado Pago exige PKCE: el `codeVerifier` es el secreto generado
 * al iniciar el flujo, cuyo hash se mandó como `code_challenge`.
 */
export function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<MpTokenResponse> {
  return requestToken({
    grant_type: "authorization_code",
    client_id: MP_CLIENT_ID,
    client_secret: MP_CLIENT_SECRET,
    code,
    redirect_uri: MP_REDIRECT_URI,
    code_verifier: codeVerifier,
  });
}

/** Renueva el access token usando el refresh token. */
export function refreshAccessToken(
  refreshToken: string,
): Promise<MpTokenResponse> {
  return requestToken({
    grant_type: "refresh_token",
    client_id: MP_CLIENT_ID,
    client_secret: MP_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
}

// ─── Checkout Pro ──────────────────────────────────────────────

export interface MpPreferenceItem {
  title: string;
  quantity: number;
  /** Precio unitario en PESOS (no centavos). */
  unit_price: number;
  currency_id: string;
}

export interface MpPreferenceInput {
  items: MpPreferenceItem[];
  payer?: { email?: string };
  external_reference: string;
  back_urls?: { success?: string; failure?: string; pending?: string };
  auto_return?: string;
  notification_url?: string;
}

export interface MpPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

/** Crea una preferencia de Checkout Pro con el token de la tienda. */
export async function createPreference(
  accessToken: string,
  input: MpPreferenceInput,
): Promise<MpPreferenceResponse> {
  const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Mercado Pago createPreference falló (${response.status}): ${detail}`,
    );
  }
  return (await response.json()) as MpPreferenceResponse;
}

export interface MpPayment {
  id: number;
  status: string;
  external_reference: string | null;
}

/** Consulta un pago por id. */
export async function getPayment(
  accessToken: string,
  paymentId: string,
): Promise<MpPayment> {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Mercado Pago getPayment falló (${response.status}): ${detail}`,
    );
  }
  return (await response.json()) as MpPayment;
}
