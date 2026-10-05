/**
 * Augmentación de tipos de Auth.js.
 *
 * Suma a la sesión y al token JWT el id del usuario, el flag `isAdmin`
 * y `mustChangePassword` (ver callbacks en `auth.config.ts`).
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    mustChangePassword?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isAdmin: boolean;
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    isAdmin?: boolean;
    mustChangePassword?: boolean;
  }
}
