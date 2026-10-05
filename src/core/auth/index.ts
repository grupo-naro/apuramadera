/**
 * Módulo Auth — API pública.
 *
 * Autenticación del panel admin (Auth.js v5, email + contraseña). El
 * proxy importa `auth.config` directamente, no este barrel.
 */
export { auth, signIn, signOut } from "./auth";
export { loginAction, signOutAction } from "./auth.actions";
export { isAdminEmail } from "./admin-allowlist";
