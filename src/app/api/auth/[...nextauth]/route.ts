/**
 * Route handler de Auth.js — atiende todo `/api/auth/*`
 * (sign-in, callback del magic link, sign-out, sesión).
 */
import { handlers } from "@/core/auth/auth";

export const { GET, POST } = handlers;
