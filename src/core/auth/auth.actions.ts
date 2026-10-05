"use server";

/**
 * Server Actions de autenticación.
 *
 * `loginAction` nunca revela si el email existe, si la clave es la
 * incorrecta o si la cuenta está bloqueada: el error es siempre el mismo.
 */
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "./auth";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (error) {
    // AuthError = credenciales inválidas. El resto (NEXT_REDIRECT) se re-lanza.
    if (error instanceof AuthError) {
      redirect("/login?error=credenciales");
    }
    throw error;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
