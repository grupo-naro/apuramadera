/**
 * Repositorio de usuarios del panel — única capa que habla con Prisma.
 */
import { prisma } from "@/core/lib/db";

import { LOCK_MINUTES, MAX_FAILED_LOGINS } from "./users.lockout";
import type { AdminUser, AuthUserRecord } from "./users.types";

const authSelect = {
  id: true,
  email: true,
  name: true,
  dni: true,
  passwordHash: true,
  mustChangePassword: true,
  failedLogins: true,
  lockedUntil: true,
} as const;

// ─── Autenticación ────────────────────────────────────────────

export function findAuthRecordByEmail(
  email: string,
): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({ where: { email }, select: authSelect });
}

export function findAuthRecordById(id: string): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({ where: { id }, select: authSelect });
}

export function findAuthRecordByDni(
  dni: string,
): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({ where: { dni }, select: authSelect });
}

/**
 * Guarda la clave inicial del admin principal (crea la fila si no
 * existía — p. ej. nunca había entrado — o completa una fila previa del
 * magic link que no tenía hash).
 */
export function setInitialPassword(
  email: string,
  passwordHash: string,
): Promise<AuthUserRecord> {
  const data = {
    passwordHash,
    mustChangePassword: false,
    failedLogins: 0,
    lockedUntil: null,
  };
  return prisma.user.upsert({
    where: { email },
    create: { email, ...data },
    update: data,
    select: authSelect,
  });
}

/**
 * Crea (sin hash) la fila de un usuario que todavía no existe, para poder
 * llevarle el contador de intentos. Sólo para el admin principal.
 */
export function ensureLoginRow(email: string): Promise<AuthUserRecord> {
  return prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
    select: authSelect,
  });
}

/**
 * Reserva un intento de login ANTES de verificar la clave, en una sola
 * sentencia SQL: sólo actúa si la cuenta no está bloqueada, suma 1 al
 * contador y, si llega a MAX_FAILED_LOGINS, lo reinicia y bloquea por
 * LOCK_MINUTES. Devuelve `false` si la cuenta está bloqueada.
 * Así, con intentos en paralelo, la base serializa las reservas y sólo
 * las primeras hasta el máximo llegan a verificar la clave. Un login
 * exitoso reinicia el estado con `resetLoginState`.
 *
 * La hora sale del reloj de la base (sin sesgo app/DB).
 * OJO: NO pasar `Date` como parámetro con casts `::timestamp`: el
 * adaptador pg puede serializarlas con el offset local del proceso y el
 * cast lo descarta, guardando/comparando hora local en vez de UTC (Prisma
 * guarda los TIMESTAMP(3) en UTC). Por eso se calcula todo en Postgres.
 */
export async function claimLoginAttempt(id: string): Promise<boolean> {
  const affected = await prisma.$executeRaw`
    UPDATE "User"
    SET "failedLogins" = CASE
          WHEN "failedLogins" + 1 >= ${MAX_FAILED_LOGINS}::int THEN 0
          ELSE "failedLogins" + 1 END,
        "lockedUntil" = CASE
          WHEN "failedLogins" + 1 >= ${MAX_FAILED_LOGINS}::int
          THEN (NOW() AT TIME ZONE 'UTC') + make_interval(mins => ${LOCK_MINUTES}::int)
          ELSE NULL END
    WHERE "id" = ${id}
      AND ("lockedUntil" IS NULL OR "lockedUntil" <= (NOW() AT TIME ZONE 'UTC'))`;
  return affected === 1;
}

export async function resetLoginState(id: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { failedLogins: 0, lockedUntil: null },
  });
}

// ─── Gestión ──────────────────────────────────────────────────

export async function listUsersWithPassword(): Promise<
  Omit<AdminUser, "isPrincipal">[]
> {
  return prisma.user.findMany({
    where: { passwordHash: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });
}

/** Alta con clave inicial = DNI. Upsert: reutiliza una fila vieja sin hash. */
export async function createUserRecord(data: {
  name: string;
  email: string;
  dni: string;
  passwordHash: string;
}): Promise<{ id: string }> {
  const fields = {
    name: data.name,
    dni: data.dni,
    passwordHash: data.passwordHash,
    mustChangePassword: true,
    failedLogins: 0,
    lockedUntil: null,
  };
  return prisma.user.upsert({
    where: { email: data.email },
    create: { email: data.email, ...fields },
    update: fields,
    select: { id: true },
  });
}

export async function setPassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: false,
      failedLogins: 0,
      lockedUntil: null,
    },
  });
}

export async function deleteUserById(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}
