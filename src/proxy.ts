/**
 * Proxy (ex-`middleware`, renombrado en Next 16) — protege el panel.
 *
 * Corre sólo sobre `/admin/*` (ver `matcher`). Valida la sesión JWT
 * desde la cookie sin tocar la base, vía el callback `authorized` de
 * `authConfig`. Sin sesión admin → Auth.js redirige a `/login`.
 *
 * Usa `auth.config.ts` (sin adapter de Prisma) a propósito.
 */
import NextAuth from "next-auth";

import { authConfig } from "@/core/auth/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
