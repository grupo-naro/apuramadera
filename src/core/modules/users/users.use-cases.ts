/**
 * Casos de uso del módulo users.
 */
import { isAdminEmail } from "@/core/auth/admin-allowlist";

import { hashPassword, verifyPassword } from "./users.password";
import {
  createUserRecord,
  deleteUserById,
  findAuthRecordByDni,
  findAuthRecordByEmail,
  findAuthRecordById,
  listUsersWithPassword,
  setPassword,
} from "./users.repository";
import { createUserSchema } from "./users.schemas";
import type { AdminUser } from "./users.types";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateUserResult =
  | { ok: true; id: string }
  | { ok: false; error: string; field?: "name" | "email" | "dni" };

/**
 * Cambia la clave del propio usuario. La identidad la da la sesión (la
 * action pasa el id); acá se validan las reglas de negocio.
 */
export async function changeOwnPassword(
  userId: string,
  password: string,
): Promise<ChangePasswordResult> {
  const user = await findAuthRecordById(userId);
  if (!user) return { ok: false, error: "No encontramos tu usuario." };

  if (user.dni && password.trim() === user.dni) {
    return { ok: false, error: "La clave no puede ser tu DNI." };
  }
  if (user.passwordHash && (await verifyPassword(password, user.passwordHash))) {
    return {
      ok: false,
      error: "La clave nueva tiene que ser distinta de la actual.",
    };
  }

  await setPassword(user.id, await hashPassword(password));
  return { ok: true };
}

/**
 * Detecta una violación de unicidad de Prisma (P2002) y qué campo afecta.
 * Se detecta por forma (`code`), como en catalog/coupons: con el driver
 * adapter no es fiable depender de `instanceof`, y `meta` puede traer
 * `target` (array o string), anidar el constraint, o venir ausente.
 * Devuelve `null` si no es P2002; `"unknown"` si no se sabe el campo.
 */
export function uniqueViolationField(
  error: unknown,
): "email" | "dni" | "unknown" | null {
  if (
    typeof error !== "object" ||
    error === null ||
    (error as { code?: unknown }).code !== "P2002"
  ) {
    return null;
  }
  const meta = (error as { meta?: unknown }).meta;
  let text = "";
  try {
    text = meta === undefined ? "" : (JSON.stringify(meta) ?? "").toLowerCase();
  } catch {
    text = "";
  }
  if (text.includes("dni")) return "dni";
  if (text.includes("email")) return "email";
  return "unknown";
}

/** Alta de un usuario del panel: su clave inicial es el DNI. */
export async function createAdminUser(input: unknown): Promise<CreateUserResult> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return {
      ok: false,
      error: issue?.message ?? "Datos inválidos.",
      field:
        field === "name" || field === "email" || field === "dni"
          ? field
          : undefined,
    };
  }
  const { name, email, dni } = parsed.data;

  if (isAdminEmail(email)) {
    return {
      ok: false,
      error: "Ese email es del admin principal.",
      field: "email",
    };
  }
  const existing = await findAuthRecordByEmail(email);
  if (existing?.passwordHash) {
    return { ok: false, error: "Ya existe un usuario con ese email.", field: "email" };
  }
  if (await findAuthRecordByDni(dni)) {
    return { ok: false, error: "Ya existe un usuario con ese DNI.", field: "dni" };
  }

  const passwordHash = await hashPassword(dni);
  try {
    const { id } = await createUserRecord({ name, email, dni, passwordHash });
    return { ok: true, id };
  } catch (error) {
    // Carrera: dos altas simultáneas pasaron el chequeo previo.
    const field = uniqueViolationField(error);
    if (field === "dni") {
      return { ok: false, error: "Ya existe un usuario con ese DNI.", field };
    }
    if (field === "email") {
      return { ok: false, error: "Ya existe un usuario con ese email.", field };
    }
    if (field === "unknown") {
      return { ok: false, error: "Ya existe un usuario con ese email o DNI." };
    }
    throw error;
  }
}

/** Baja de un usuario. No se puede eliminar a uno mismo ni al principal. */
export async function removeAdminUser(
  id: string,
  actingUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (id === actingUserId) {
    return { ok: false, error: "No podés eliminar tu propio usuario." };
  }
  const user = await findAuthRecordById(id);
  if (!user) return { ok: false, error: "El usuario no existe." };
  if (isAdminEmail(user.email)) {
    return { ok: false, error: "No se puede eliminar al admin principal." };
  }
  await deleteUserById(id);
  return { ok: true };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const rows = await listUsersWithPassword();
  return rows.map((row) => ({ ...row, isPrincipal: isAdminEmail(row.email) }));
}

/**
 * ¿La sesión sigue siendo válida? El JWT dura días: si el usuario fue
 * eliminado, deja de abrirle el panel. Sin id (sesión vieja del magic
 * link) → `false`, así que se le pide ingresar de nuevo.
 */
export async function isActiveAdmin(id: string): Promise<boolean> {
  if (!id) return false;
  const user = await findAuthRecordById(id);
  return Boolean(user?.passwordHash);
}
