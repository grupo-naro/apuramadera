/**
 * Callback del OAuth de Mercado Pago.
 *
 * MP redirige acá con `code` + `state`. Se valida el `state` contra
 * la cookie, se canjea el `code` por tokens (con el `code_verifier`
 * de PKCE) y se guarda la conexión. Termina siempre en
 * `/admin/configuracion` (con `connected` o `error`).
 */
import { NextResponse } from "next/server";

import { requireActiveAdmin } from "@/core/auth/require-active-admin";
import { exchangeCodeForToken } from "@/core/modules/payments/mercadopago";
import { storeConnection } from "@/core/modules/payments/payments.use-cases";

/** Lee una cookie del header de la request. */
function readCookie(request: Request, name: string): string | undefined {
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  return request.headers.get("cookie")?.match(pattern)?.[1];
}

export async function GET(request: Request) {
  const user = await requireActiveAdmin();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const savedState = readCookie(request, "mp_oauth_state");
  const codeVerifier = readCookie(request, "mp_oauth_verifier");

  const configUrl = new URL("/admin/configuracion", request.url);

  function finish(param: "connected" | "error", value: string) {
    configUrl.searchParams.set(param, value);
    const response = NextResponse.redirect(configUrl);
    response.cookies.delete("mp_oauth_state");
    response.cookies.delete("mp_oauth_verifier");
    return response;
  }

  if (oauthError || !code) return finish("error", "denied");
  if (!state || !savedState || state !== savedState) {
    return finish("error", "state");
  }
  if (!codeVerifier) return finish("error", "state");

  try {
    const token = await exchangeCodeForToken(code, codeVerifier);
    await storeConnection(token);
  } catch (error) {
    console.error("MP OAuth callback falló:", error);
    return finish("error", "exchange");
  }

  return finish("connected", "1");
}
