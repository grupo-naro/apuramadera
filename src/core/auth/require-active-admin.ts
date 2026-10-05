/**
 * Guard para Route Handlers de admin (`/api/*`).
 *
 * El proxy sólo cubre `/admin/*`, así que los handlers bajo `/api` deben
 * verificar la sesión ellos mismos. Además de `isAdmin`, exige un `id`
 * (los JWT viejos del magic link no lo traen), que no haya que cambiar
 * la clave y que el usuario siga existiendo (el JWT dura días).
 *
 * No lo importa `users.actions.ts`: crearía un ciclo vía el barrel de users.
 */
import type { Session } from "next-auth";

import { isActiveAdmin } from "@/core/modules/users";

import { auth } from "./auth";

export async function requireActiveAdmin(): Promise<Session["user"] | null> {
  const session = await auth();
  const user = session?.user;
  if (!user || user.isAdmin !== true) return null;
  if (!user.id) return null;
  if (user.mustChangePassword) return null;
  if (!(await isActiveAdmin(user.id))) return null;
  return user;
}
