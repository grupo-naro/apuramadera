"use client";

/**
 * Editor del modelo 3D del producto (vista AR de la PDP).
 *
 * El admin sube DOS archivos: `.glb` (AR en Android / visor 3D en
 * todos lados) y `.usdz` (AR Quick Look en iPhone). Los dos van
 * directo a Cloudinary como assets `raw`; los `publicId` quedan en el
 * form (`modelGlbPublicId` / `modelUsdzPublicId`) y se persisten al
 * guardar el producto.
 *
 * Sólo el `.glb` es necesario para mostrar la vista AR. Sin `.usdz`,
 * el iPhone ve el visor 3D pero no el botón "ver en tu baño".
 */
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { BoxIcon, Trash2Icon } from "lucide-react";

import type { ProductFormInput } from "@/core/modules/catalog/catalog.admin.schemas";
import { Button } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";

import { uploadToCloudinary } from "./cloudinary-upload";

/** Último segmento de un `publicId` de Cloudinary — para mostrar. */
function basename(publicId: string): string {
  const parts = publicId.split("/");
  return parts[parts.length - 1] || publicId;
}

type Slot = "glb" | "usdz";
type SlotField = "modelGlbPublicId" | "modelUsdzPublicId";

const SLOTS: {
  slot: Slot;
  field: SlotField;
  label: string;
  accept: string;
}[] = [
  {
    slot: "glb",
    field: "modelGlbPublicId",
    label: ".glb (Android / visor 3D)",
    accept: ".glb,model/gltf-binary",
  },
  {
    slot: "usdz",
    field: "modelUsdzPublicId",
    label: ".usdz (iPhone / Quick Look)",
    accept: ".usdz,model/vnd.usdz+zip",
  },
];

export function ProductModel3DEditor() {
  const { watch, setValue } = useFormContext<ProductFormInput>();
  const values = {
    glb: watch("modelGlbPublicId"),
    usdz: watch("modelUsdzPublicId"),
  };

  const inputRefs = {
    glb: useRef<HTMLInputElement>(null),
    usdz: useRef<HTMLInputElement>(null),
  };
  const [busy, setBusy] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(field: SlotField, file: File, slot: Slot) {
    setError(null);
    setBusy(slot);
    try {
      const publicId = await uploadToCloudinary(file, { resourceType: "raw" });
      setValue(field, publicId, { shouldDirty: true });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setError(`No se pudo subir el ${slot}: ${reason}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <BoxIcon className="size-4 text-muted-foreground" />
        <CardTitle>Modelo 3D / AR</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {SLOTS.map(({ slot, field, label, accept }) => {
          const value = values[slot];
          return (
            <div
              key={slot}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
                <span className="truncate text-sm">
                  {value ? basename(value) : "Sin archivo"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => inputRefs[slot].current?.click()}
                >
                  {busy === slot
                    ? "Subiendo…"
                    : value
                      ? "Reemplazar"
                      : "Subir"}
                </Button>
                {value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Quitar ${slot}`}
                    disabled={busy !== null}
                    onClick={() => {
                      setError(null);
                      setValue(field, "", { shouldDirty: true });
                    }}
                  >
                    <Trash2Icon className="size-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <input
                ref={inputRefs[slot]}
                type="file"
                accept={accept}
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(field, file, slot);
                  event.target.value = "";
                }}
              />
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground">
          El <code>.glb</code> alcanza para mostrar la vista AR. Sin{" "}
          <code>.usdz</code>, el iPhone ve el visor 3D pero no abre en AR.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
