/**
 * Configuración base de Auth.js.
 *
 * Este archivo es seguro de importar desde el `proxy` — NO incluye
 * providers ni toca la base ni usa `node:crypto`. `auth.ts` lo completa
 * con el provider Credentials.
 *
 * La sesión es JWT: el proxy valida la cookie sin DB. El JWT lleva:
 *  - `isAdmin`: sólo se emite tras un login exitoso (`authorize`).
 *  - `mustChangePassword`: obliga a pasar por `/admin/cambiar-clave`.
 */
import type { NextAuthConfig } from "next-auth";

/** Pantalla de cambio de clave (primer ingreso o voluntario). */
export const CHANGE_PASSWORD_PATH = "/admin/cambiar-clave";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // El proxy sólo lee la sesión — no necesita providers.
  providers: [],
  callbacks: {
    /** `user` sólo viene en el login: es lo que devolvió `authorize`. */
    jwt({ token, user }) {
      if (user) {
        token.isAdmin = true;
        token.uid = user.id;
        token.mustChangePassword = user.mustChangePassword === true;
      }
      return token;
    },
    /** Expone id, flag de admin y flag de cambio de clave en la sesión. */
    session({ session, token }) {
      session.user.id = typeof token.uid === "string" ? token.uid : "";
      session.user.isAdmin = token.isAdmin === true;
      session.user.mustChangePassword = token.mustChangePassword === true;
      return session;
    },
    /** Lo usa el proxy para proteger `/admin/*`. */
    authorized({ auth, request }) {
      if (auth?.user?.isAdmin !== true) return false;
      if (
        auth.user.mustChangePassword &&
        request.nextUrl.pathname !== CHANGE_PASSWORD_PATH
      ) {
        return Response.redirect(new URL(CHANGE_PASSWORD_PATH, request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
