"use client";

/**
 * Formulario de cambio de clave. En éxito la action cierra la sesión y
 * redirige a `/login`, así que acá sólo se muestran los errores.
 */
import { useState, useTransition } from "react";

import { changePasswordAction } from "@/core/modules/users/users.actions";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await changePasswordAction({
        password: String(form.get("password") ?? ""),
        confirm: String(form.get("confirm") ?? ""),
      });
      // Sólo llega acá si hubo error (en éxito la action redirige).
      setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Clave nueva</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Repetí la clave</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar clave"}
      </Button>
    </form>
  );
}
