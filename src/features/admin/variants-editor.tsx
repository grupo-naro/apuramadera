"use client";

/**
 * Editor de opciones y variantes del formulario de producto.
 *
 * Lista manual: el admin define los ejes (Talle, Color…) y agrega
 * cada variante eligiendo sus valores + precio/stock/SKU. Lee el
 * `control` del formulario padre vía `useFormContext`.
 */
import { useFieldArray, useFormContext } from "react-hook-form";
import { PlusIcon, Trash2Icon } from "lucide-react";

import {
  MAX_OPTIONS,
  type ProductFormInput,
} from "@/core/modules/catalog/catalog.admin.schemas";
import { Button } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { Switch } from "@/core/ui/switch";

/** Texto de error de un campo, si lo hay. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function VariantsEditor() {
  const form = useFormContext<ProductFormInput>();
  const { control, register, getValues, setValue, watch, formState } = form;

  const optionFields = useFieldArray({ control, name: "options" });
  const variantFields = useFieldArray({ control, name: "variants" });
  const errors = formState.errors;

  const optionNames = watch("options");
  const optionCount = optionFields.fields.length;

  /** Agrega un eje de variación — y un slot de valor a cada variante. */
  function addOption() {
    if (optionCount >= MAX_OPTIONS) return;
    setValue(
      "variants",
      getValues("variants").map((variant) => ({
        ...variant,
        values: [...variant.values, ""],
      })),
    );
    optionFields.append({ name: "" });
  }

  /** Quita un eje — y su valor correspondiente de cada variante. */
  function removeOption(index: number) {
    setValue(
      "variants",
      getValues("variants").map((variant) => ({
        ...variant,
        values: variant.values.filter((_, i) => i !== index),
      })),
    );
    optionFields.remove(index);
  }

  function addVariant() {
    variantFields.append({
      values: optionFields.fields.map(() => ""),
      sku: "",
      price: "",
      compareAtPrice: "",
      stock: "",
      isActive: true,
    });
  }

  return (
    <>
      {/* ── Opciones ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Opciones</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            disabled={optionCount >= MAX_OPTIONS}
          >
            <PlusIcon className="size-4" />
            Agregar opción
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {optionCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Agregá los ejes de variación del producto — por ejemplo Talle y
              Color.
            </p>
          ) : (
            optionFields.fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`option-${index}`}>Opción {index + 1}</Label>
                  <Input
                    id={`option-${index}`}
                    placeholder="Talle, Color…"
                    className="mt-1"
                    {...register(`options.${index}.name`)}
                  />
                  <FieldError
                    message={errors.options?.[index]?.name?.message}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Quitar opción"
                  onClick={() => removeOption(index)}
                >
                  <Trash2Icon className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
          <FieldError message={errors.options?.message} />
        </CardContent>
      </Card>

      {/* ── Variantes ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Variantes</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            disabled={optionCount === 0}
          >
            <PlusIcon className="size-4" />
            Agregar variante
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {optionCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Primero agregá al menos una opción.
            </p>
          ) : variantFields.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Agregá las variantes que existen — cada combinación de valores.
            </p>
          ) : (
            variantFields.fields.map((field, vIndex) => {
              const variantErrors = errors.variants?.[vIndex];
              return (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      Variante {vIndex + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Switch
                          checked={watch(`variants.${vIndex}.isActive`)}
                          onCheckedChange={(checked) =>
                            setValue(`variants.${vIndex}.isActive`, checked)
                          }
                        />
                        Disponible
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar variante"
                        onClick={() => variantFields.remove(vIndex)}
                      >
                        <Trash2Icon className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Valores de cada opción */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {optionFields.fields.map((option, oIndex) => (
                      <div key={option.id}>
                        <Label htmlFor={`v-${vIndex}-o-${oIndex}`}>
                          {optionNames?.[oIndex]?.name?.trim() ||
                            `Opción ${oIndex + 1}`}
                        </Label>
                        <Input
                          id={`v-${vIndex}-o-${oIndex}`}
                          className="mt-1"
                          {...register(
                            `variants.${vIndex}.values.${oIndex}`,
                          )}
                        />
                        <FieldError
                          message={
                            variantErrors?.values?.[oIndex]?.message
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Precio / stock / SKU */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <Label htmlFor={`v-${vIndex}-price`}>Precio</Label>
                      <Input
                        id={`v-${vIndex}-price`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="mt-1"
                        {...register(`variants.${vIndex}.price`)}
                      />
                      <FieldError message={variantErrors?.price?.message} />
                    </div>
                    <div>
                      <Label htmlFor={`v-${vIndex}-compare`}>
                        Precio de lista
                      </Label>
                      <Input
                        id={`v-${vIndex}-compare`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="Opcional"
                        className="mt-1"
                        {...register(`variants.${vIndex}.compareAtPrice`)}
                      />
                      <FieldError
                        message={variantErrors?.compareAtPrice?.message}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`v-${vIndex}-stock`}>Stock</Label>
                      <Input
                        id={`v-${vIndex}-stock`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="mt-1"
                        {...register(`variants.${vIndex}.stock`)}
                      />
                      <FieldError message={variantErrors?.stock?.message} />
                    </div>
                    <div>
                      <Label htmlFor={`v-${vIndex}-sku`}>SKU</Label>
                      <Input
                        id={`v-${vIndex}-sku`}
                        placeholder="Opcional"
                        className="mt-1"
                        {...register(`variants.${vIndex}.sku`)}
                      />
                      <FieldError message={variantErrors?.sku?.message} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <FieldError message={errors.variants?.message} />
        </CardContent>
      </Card>
    </>
  );
}
