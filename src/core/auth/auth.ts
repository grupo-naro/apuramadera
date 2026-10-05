/**
 * Instancia de Auth.js — configuración completa.
 *
 * Suma a `authConfig` el provider Credentials (email + contraseña).
 * Las sesiones son JWT: no hay adapter ni filas de `Session`.
 *
 * Server-side only — no importar desde componentes cliente ni desde
 * el proxy (usar `auth.config.ts` ahí).
 *
 * Importa `users.credentials` directo (no el barrel del módulo) para
 * evitar un ciclo: el barrel exporta acciones que importan este archivo.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticate } from "@/core/modules/users/users.credentials";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        return authenticate(email, password);
      },
    }),
  ],
});
