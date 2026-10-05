/**
 * Inicio del OAuth de Mercado Pago.
 *
 * Genera el `state` anti-CSRF y el par PKCE (`code_verifier` +
 * `code_challenge`) — MP exige PKCE. Ambos secretos van en cookies
 * httpOnly para el callback. Arma la URL de autorización y redirige.
 *
 * Sólo para admins — `/api/*` no pasa por el proxy, así que la
 * verificación es explícita.
 */
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { requireActiveAdmin } from "@/core/auth/require-active-admin";
import {
  MP_AUTHORIZE_URL,
  MP_CLIENT_ID,
  MP_REDIRECT_URI,
  isMercadoPagoConfigured,
} from "@/core/modules/payments/payments.config";

/** Opciones comunes de las cookies temporales del flujo OAuth. */
const OAUTH_COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 600,
  path: "/",
} as const;

export async function GET(request: Request) {
  const user = await requireActiveAdmin();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const configUrl = new URL("/admin/configuracion", request.url);
  if (!isMercadoPagoConfigured) {
    configUrl.searchParams.set("error", "config");
    return NextResponse.redirect(configUrl);
  }

  const state = randomBytes(16).toString("hex");
  // PKCE: el verifier es secreto; el challenge (su hash SHA-256) viaja
  // en la URL de autorización.
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const authorizeUrl = new URL(MP_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", MP_CLIENT_ID);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("platform_id", "mp");
  authorizeUrl.searchParams.set("redirect_uri", MP_REDIRECT_URI);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("mp_oauth_state", state, OAUTH_COOKIE);
  response.cookies.set("mp_oauth_verifier", codeVerifier, OAUTH_COOKIE);
  return response;
}
