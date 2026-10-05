"use client";

/**
 * Editor de imágenes del formulario de producto.
 *
 * Sube los archivos DIRECTO a Cloudinary con una firma del server
 * (`getUploadSignature`) — el navegador nunca ve el `api_secret`.
 * Los `public_id` resultantes se guardan en el campo `images` del
 * formulario; las filas `ProductImage` se persisten al guardar.
 */
import { useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImagePlusIcon,
  Trash2Icon,
} from "lucide-react";

import type { ProductFormInput } from "@/core/modules/catalog/catalog.admin.schemas";
import { Button } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { Input } from "@/core/ui/input";
import { StoreImage } from "@/core/ui/store-image";

import { uploadToCloudinary } from "./cloudinary-upload";

export function ProductImagesEditor() {
  const { control, register } = useFormContext<ProductFormInput>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "images",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const publicId = await uploadToCloudinary(file);
        append({ publicId, alt: "" });
      }
    } catch {
      setError(
        "No se pudieron subir las imágenes. Revisá la configuración de Cloudinary.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Imágenes</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlusIcon className="size-4" />
          {uploading ? "Subiendo…" : "Subir imágenes"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) {
              void handleFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Subí las fotos del producto. La primera es la principal.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-lg border p-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <StoreImage
                    src={field.publicId}
                    alt={field.alt || "Imagen del producto"}
                    preset="thumbnail"
                  />
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Principal
                    </span>
                  )}
                </div>
                <Input
                  placeholder="Texto alternativo"
                  className="h-8 text-xs"
                  {...register(`images.${index}.alt`)}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Mover a la izquierda"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowLeftIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Mover a la derecha"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowRightIcon className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Quitar imagen"
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
