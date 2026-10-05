"use server";

/**
 * Server actions del módulo users.
 *
 * Todas revalidan la sesión: no confían en el proxy (una Server Action
 * se puede invocar directo por POST).
 */
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { auth, signOut } from "@/core/auth/auth";

import {
  changePasswordSchema,
  type ChangePasswordInput,
  type CreateUserInput,
} from "./users.schemas";
import {
  changeOwnPassword,
  createAdminUser,
  removeAdminUser,
  type CreateUserResult,
} from "./users.use-cases";

/** Sesión admin válida y sin cambio de clave pendiente, o `null`. */
async function requireAdminSession() {
  const session = await auth();
  const user = session?.user;
  if (!user?.isAdmin || !user.id || user.mustChangePassword) return null;
  return user;
}

const DENIED = { ok: false, error: "No tenés permiso para hacer esto." } as const;

export async function createUserAction(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  if (!(await requireAdminSession())) return DENIED;
  const result = await createAdminUser(input);
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}

export async function deleteUserAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireAdminSession();
  if (!actor) return DENIED;
  const result = await removeAdminUser(id, actor.id);
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}

const SIGNOUT_FAILED =
  "Tu clave se cambió, pero no pudimos cerrar tu sesión. Ingresá de nuevo desde /login con la clave nueva.";

/**
 * Cambia la clave del usuario logueado y cierra la sesión: tiene que
 * volver a entrar con la clave nueva. En éxito redirige (no retorna).
 */
export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<{ ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.id) {
    return { ok: false, error: "Tu sesión venció. Volvé a ingresar." };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const result = await changeOwnPassword(session.user.id, parsed.data.password);
  if (!result.ok) return result;

  try {
    await signOut({ redirectTo: "/login?clave=actualizada" });
  } catch (error) {
    // signOut redirige lanzando un error interno de Next: hay que dejarlo pasar.
    unstable_rethrow(error);
    // Cualquier otro fallo: la clave ya se guardó, pero el JWT viejo sigue vivo.
    return {
      ok: false,
      error: SIGNOUT_FAILED,
    };
  }
  // signOut siempre redirige; si llegara a retornar, tratarlo como fallo de cierre.
  return {
    ok: false,
    error: SIGNOUT_FAILED,
  };
}
