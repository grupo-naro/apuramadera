import { redirect } from "next/navigation";

/**
 * Sección "Contenido" deshabilitada temporalmente.
 *
 * El código de las páginas (`page.tsx`, `nuevo`, `[id]`, `preview`) y del
 * módulo CMS se conserva, pero el acceso queda cerrado: este layout
 * envuelve toda la ruta `/admin/contenido/*` y redirige al panel antes de
 * renderizar nada. Para reactivar la sección: borrar este archivo y
 * descomentar el ítem "Contenido" en `admin-nav.tsx`.
 */
export default function ContenidoDisabledLayout() {
  redirect("/admin");
}
