/**
 * Reglas de bloqueo por intentos fallidos de login (puras, sin DB).
 *
 * 5 fallos consecutivos bloquean la cuenta 15 minutos. El repositorio
 * lleva el contador (`failedLogins`) y el vencimiento (`lockedUntil`).
 */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export function isLocked(
  lockedUntil: Date | null,
  now: Date = new Date(),
): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

export function shouldLock(failedLogins: number): boolean {
  return failedLogins >= MAX_FAILED_LOGINS;
}

export function lockExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + LOCK_MINUTES * 60_000);
}
