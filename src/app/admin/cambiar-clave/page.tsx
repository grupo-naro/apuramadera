import type { Metadata } from "next";

import { auth } from "@/core/auth";
import { ChangePasswordForm } from "@/features/auth/change-password-form";

export const metadata: Metadata = {
  title: "Cambiar clave",
  robots: { index: false },
};

export default async function ChangePasswordPage() {
  const session = await auth();
  const forced = session?.user?.mustChangePassword === true;

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Cambiar clave</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {forced
          ? "Es tu primer ingreso: elegí una clave nueva para usar el panel."
          : "Elegí una clave nueva. Después tenés que volver a ingresar."}
      </p>
      <ChangePasswordForm />
    </div>
  );
}
