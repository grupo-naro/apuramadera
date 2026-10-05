/**
 * A dónde ir justo después de loguearse.
 *
 * El destino lo decide una pantalla intermedia (`/login/continuar`) y no
 * el propio login: el proxy sólo conoce `mustChangePassword` cuando ya
 * existe la cookie de sesión. Si el login redirigiera a `/admin` y el
 * proxy lo desviara a `/admin/cambiar-clave`, el navegador quedaría con
 * la URL `/admin` mostrando la pantalla de cambio de clave, y el
 * formulario enviaría su Server Action a `/admin`, que el proxy vuelve
 * a desviar: la acción nunca corre ("This page couldn't load").
 */
import { CHANGE_PASSWORD_PATH } from "./auth.config";

export function postLoginDestination(
  user: { isAdmin?: boolean; mustChangePassword?: boolean } | undefined,
): string {
  if (!user?.isAdmin) return "/login";
  return user.mustChangePassword ? CHANGE_PASSWORD_PATH : "/admin";
}
