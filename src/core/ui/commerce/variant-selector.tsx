"use client";

/**
 * VariantSelector — selector de variantes para la PDP.
 *
 * Renderiza un grupo de botones por cada eje de variación (Talle,
 * Color…) y resuelve la variante que matchea la selección. Avisa al
 * padre vía `onVariantChange`; la PDP (M1.4) se encarga de mostrar
 * precio, stock y el botón de compra a partir de esa variante.
 *
 * Para productos sin opciones (1 sola variante) no renderiza nada,
 * pero igual reporta esa variante al padre.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/core/lib/utils";
import type { ProductDetail, ProductVariant } from "@/core/modules/catalog";

interface VariantSelectorProps {
  product: ProductDetail;
  onVariantChange?: (variant: ProductVariant | null) => void;
}

export function VariantSelector({
  product,
  onVariantChange,
}: VariantSelectorProps) {
  // optionValueId → optionId, para reconstruir la selección.
  const valueToOption = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of product.options) {
      for (const value of option.values) map.set(value.id, option.id);
    }
    return map;
  }, [product.options]);

  // Selección inicial: la primera variante con stock, o la primera.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial =
      product.variants.find((v) => v.inStock) ?? product.variants[0];
    if (!initial) return {};
    const result: Record<string, string> = {};
    for (const valueId of initial.optionValueIds) {
      const optionId = valueToOption.get(valueId);
      if (optionId) result[optionId] = valueId;
    }
    return result;
  });

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (product.options.length === 0) return product.variants[0] ?? null;
    if (Object.keys(selected).length !== product.options.length) return null;
    const ids = Object.values(selected);
    return (
      product.variants.find(
        (v) =>
          v.optionValueIds.length === ids.length &&
          ids.every((id) => v.optionValueIds.includes(id)),
      ) ?? null
    );
  }, [selected, product.options.length, product.variants]);

  // Guardamos el callback en un ref: así el efecto sólo se dispara
  // cuando cambia la variante, no en cada render del padre.
  const onChangeRef = useRef(onVariantChange);
  useEffect(() => {
    onChangeRef.current = onVariantChange;
  });
  useEffect(() => {
    onChangeRef.current?.(selectedVariant);
  }, [selectedVariant]);

  /** ¿Existe una variante con este valor y el resto de la selección actual? */
  function isAvailable(optionId: string, valueId: string): boolean {
    return product.variants.some((variant) => {
      if (!variant.optionValueIds.includes(valueId)) return false;
      for (const [otherOptionId, otherValueId] of Object.entries(selected)) {
        if (otherOptionId === optionId) continue;
        if (!variant.optionValueIds.includes(otherValueId)) return false;
      }
      return true;
    });
  }

  if (product.options.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {product.options.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          <span className="text-sm font-medium">{option.name}</span>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selected[option.id] === value.id;
              const available = isAvailable(option.id, value.id);
              return (
                <button
                  key={value.id}
                  type="button"
                  disabled={!available}
                  aria-pressed={isSelected}
                  onClick={() =>
                    setSelected((prev) => ({
                      ...prev,
                      [option.id]: value.id,
                    }))
                  }
                  className={cn(
                    "min-w-11 rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent",
                    !available &&
                      "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:bg-background",
                  )}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
