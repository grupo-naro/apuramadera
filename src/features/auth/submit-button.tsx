"use client";

/**
 * Botón de envío del formulario de login — muestra estado "enviando"
 * mientras la Server Action está en curso.
 */
import { useFormStatus } from "react-dom";

import { Button } from "@/core/ui/button";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Ingresando…" : "Ingresar"}
    </Button>
  );
}
