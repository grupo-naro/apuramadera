import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRoundIcon, LogOutIcon } from "lucide-react";

import { auth, signOutAction } from "@/core/auth";
import { isActiveAdmin } from "@/core/modules/users";
import { Button, buttonVariants } from "@/core/ui/button";
import { AdminMobileHeader } from "@/features/admin/admin-mobile-header";
import { AdminNav } from "@/features/admin/admin-nav";
import { storeConfig } from "@/store.config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El proxy ya bloquea `/admin/*`; esto es defensa en profundidad.
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login");

  // El JWT dura días: si el usuario fue eliminado, ya no entra.
  if (!(await isActiveAdmin(session.user.id))) redirect("/login");

  // Primer ingreso: sólo se ve la pantalla de cambio de clave, sin el
  // menú (el proxy ya redirige cualquier otra ruta a ella).
  if (session.user.mustChangePassword) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  const email = session.user.email;

  return (
    <div className="flex flex-1">
      {/* Sidebar — escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="border-b px-5 py-4">
          <span className="block font-bold tracking-tight">
            {storeConfig.shortName}
          </span>
          <span className="text-xs text-muted-foreground">Panel de la tienda</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <AdminNav />
        </div>

        <div className="border-t p-3">
          {email && (
            <p
              className="truncate px-3 text-xs text-muted-foreground"
              title={email}
            >
              {email}
            </p>
          )}
          <Link
            href="/admin/cambiar-clave"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "mt-2 w-full justify-start gap-3",
            })}
          >
            <KeyRoundIcon className="size-4" />
            Cambiar clave
          </Link>
          <form action={signOutAction} className="mt-2">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3"
            >
              <LogOutIcon className="size-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileHeader userEmail={email} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
