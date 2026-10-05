import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases de Tailwind resolviendo conflictos.
 * `cn("p-2", condicion && "p-4")` → `"p-4"`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deriva un slug url-safe a partir de un texto: minúsculas, sin
 * acentos, espacios y símbolos → guiones.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
