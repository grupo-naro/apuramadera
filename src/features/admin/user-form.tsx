"use client";

/**
 * Alta de usuario del panel. La clave inicial es el DNI; el usuario
 * tiene que cambiarla en su primer ingreso.
 */
import { useState, useTransition } from "react";

import { createUserAction } from "@/core/modules/users/users.actions";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";

export function UserForm() {
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const result = await createUserAction({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        dni: String(form.get("dni") ?? ""),
      });
      if (result.ok) {
        setCreated(String(form.get("email") ?? ""));
        formEl.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-lg border p-4 sm:p-6"
    >
      <h2 className="font-semibold">Nuevo usuario</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-email">Email</Label>
          <Input id="user-email" name="email" type="email" required autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dni">DNI</Label>
          <Input
            id="dni"
            name="dni"
            inputMode="numeric"
            required
            autoComplete="off"
            placeholder="30123456"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        La clave inicial es el DNI (sólo números). Al ingresar por primera vez
        el sistema le va a pedir que elija una clave nueva.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {created && (
        <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">
          Usuario {created} creado.
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creando…" : "Crear usuario"}
      </Button>
    </form>
  );
}
