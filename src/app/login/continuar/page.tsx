import { redirect } from "next/navigation";

import { auth } from "@/core/auth";
import { postLoginDestination } from "@/core/auth/post-login";

// Depende de la cookie de sesión: nunca se cachea.
export const dynamic = "force-dynamic";

/**
 * Paso intermedio tras el login. Lee la sesión ya creada y redirige al
 * destino real, así la URL del navegador coincide con la página que se
 * ve (ver `postLoginDestination`).
 */
export default async function ContinuarPage() {
  const session = await auth();
  redirect(postLoginDestination(session?.user));
}
