"use client";

/**
 * Selector de orden del listado. Actualiza el query param `sort` y
 * resetea `page` a 1. El listado (Server Component) re-renderiza con
 * el nuevo orden.
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";

const SORT_OPTIONS = [
  { value: "newest", label: "Más nuevos" },
  { value: "name", label: "Nombre (A-Z)" },
] as const;

export function ProductSort({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams);
    params.set("sort", next);
    params.delete("page"); // un orden nuevo vuelve a la página 1
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-48" aria-label="Ordenar productos">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
