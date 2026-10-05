/**
 * Verificación de credenciales para el login (la usa `auth.ts`).
 *
 * Archivo aparte del barrel a propósito: `auth.ts` lo importa directo
 * para no crear un ciclo con `users.actions.ts` (que importa `auth.ts`).
 *
 * Casos:
 *  - Usuario con `passwordHash`: se verifica, con bloqueo por intentos.
 *  - Admin principal (email en `ADMIN_EMAILS`) sin hash todavía: entra
 *    con `ADMIN_INITIAL_PASSWORD` y se le guarda el hash.
 *  - Cualquier otro caso: `null`. El error siempre es genérico.
 */
import { createHash, timingSafeEqual } from "node:crypto";

import { isAdminEmail } from "@/core/auth/admin-allowlist";

import { isLocked } from "./users.lockout";
import { hashPassword, verifyPassword } from "./users.password";
import {
  claimLoginAttempt,
  ensureLoginRow,
  findAuthRecordByEmail,
  resetLoginState,
  setInitialPassword,
} from "./users.repository";
import type { AuthenticatedUser, AuthUserRecord } from "./users.types";

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Compara con la env en tiempo constante (hasheando ambos lados). */
function matchesInitialPassword(input: string): boolean {
  const initial = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initial) return false;
  return timingSafeEqual(sha256(input), sha256(initial));
}

function toAuthenticated(user: AuthUserRecord): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function authenticate(
  rawEmail: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  if (typeof rawEmail !== "string" || typeof password !== "string") return null;
  const email = rawEmail.trim().toLowerCase();
  if (!email || !password) return null;

  let user = await findAuthRecordByEmail(email);

  // Sin hash todavía: sólo el admin principal puede entrar (con la env).
  // Se le crea la fila (sin hash) para que sus intentos también cuenten.
  if (!user?.passwordHash) {
    if (!isAdminEmail(email) || !process.env.ADMIN_INITIAL_PASSWORD) {
      return null;
    }
    user = user ?? (await ensureLoginRow(email));
  }

  const now = new Date();
  if (isLocked(user.lockedUntil, now)) return null; // precheck barato

  // Reserva atómica del intento ANTES de verificar; false = bloqueada.
  if (!(await claimLoginAttempt(user.id))) return null;

  const ok = user.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : matchesInitialPassword(password);
  if (!ok) return null; // el intento ya fue contado por la reserva

  if (!user.passwordHash) {
    // `setInitialPassword` ya reinicia contador y bloqueo.
    return toAuthenticated(
      await setInitialPassword(email, await hashPassword(password)),
    );
  }
  await resetLoginState(user.id);
  return toAuthenticated(user);
}
