"use client";

/**
 * Editor de un bloque de la home (CMS · M5.2).
 *
 * Un único `<BlockForm>` para los 3 tipos: los 3 form schemas comparten
 * el mismo shape (`BlockFormValues`), así que RHF se tipa con esa
 * unión y la UI cambia los campos según `type`. La submit pasa por
 * `saveBlock`, que valida con el schema del tipo y arma la `data` real.
 */
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ImagePlusIcon } from "lucide-react";

import type { CategoryOption } from "@/core/modules/catalog/catalog.admin.types";
import { saveBlock } from "@/core/modules/cms/cms.actions";
import {
  CAROUSEL_NEWEST_VALUE,
  HOME_BLOCK_FORM_SCHEMAS,
  HOME_BLOCK_TYPE_LABELS,
  type BlockFormValues,
  type HomeBlockType,
} from "@/core/modules/cms/cms.schemas";
import type { HomeBlockForEdit } from "@/core/modules/cms/cms.types";
import { Button, buttonVariants } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { StoreImage } from "@/core/ui/store-image";
import { Switch } from "@/core/ui/switch";
import { Textarea } from "@/core/ui/textarea";

import { uploadToCloudinary } from "./cloudinary-upload";

const EMPTY_VALUES: BlockFormValues = {
  isActive: true,
  heading: "",
  imagePublicId: "",
  imageAlt: "",
  subheading: "",
  ctaLabel: "",
  ctaHref: "",
  categorySlug: CAROUSEL_NEWEST_VALUE,
  limit: "8",
  startsAt: "",
  endsAt: "",
};

interface BlockFormProps {
  type: HomeBlockType;
  block?: HomeBlockForEdit;
  /** Categorías para el select del carrusel. */
  categories: CategoryOption[];
}

export function BlockForm({ type, block, categories }: BlockFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blockId = block?.id ?? null;

  const form = useForm<BlockFormValues>({
    resolver: zodResolver(HOME_BLOCK_FORM_SCHEMAS[type]),
    defaultValues: block?.values ?? EMPTY_VALUES,
  });

  async function handleImageFile(file: File) {
    setServerError(null);
    setUploading(true);
    try {
      const publicId = await uploadToCloudinary(file);
      form.setValue("imagePublicId", publicId, { shouldValidate: true });
    } catch {
      setServerError(
        "No se pudo subir la imagen. Revisá la configuración de Cloudinary.",
      );
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(values: BlockFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveBlock(blockId, type, values);
      if (result.ok) {
        router.push("/admin/contenido");
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-w-2xl flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>{HOME_BLOCK_TYPE_LABELS[type]}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* ── HERO_BANNER ── */}
            {type === "HERO_BANNER" && (
              <>
                <FormField
                  control={form.control}
                  name="imagePublicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-3">
                          {field.value ? (
                            <div className="relative aspect-16/7 w-full overflow-hidden rounded-md border bg-muted">
                              <StoreImage
                                src={field.value}
                                alt="Banner"
                                preset="banner"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-16/7 items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">
                              Subí una imagen apaisada (idealmente 16:7).
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="self-start"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImagePlusIcon className="size-4" />
                            {uploading
                              ? "Subiendo…"
                              : field.value
                                ? "Cambiar imagen"
                                : "Subir imagen"}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleImageFile(file);
                              event.target.value = "";
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageAlt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto alternativo</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional — describí la imagen" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="heading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subheading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bajada</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ctaLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Botón (texto)</FormLabel>
                        <FormControl>
                          <Input placeholder="Opcional — ej. Ver productos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ctaHref"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Botón (link)</FormLabel>
                        <FormControl>
                          <Input placeholder="/productos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* ── PRODUCT_CAROUSEL ── */}
            {type === "PRODUCT_CAROUSEL" && (
              <>
                <FormField
                  control={form.control}
                  name="heading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional — ej. Destacados" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categorySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Productos de</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={CAROUSEL_NEWEST_VALUE}>
                            Más nuevos (todas las categorías)
                          </SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                              {"   ".repeat(category.depth)}
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad a mostrar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={20}
                          className="w-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Entre 1 y 20 productos.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* ── CATEGORY_GRID ── */}
            {type === "CATEGORY_GRID" && (
              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional — ej. Categorías" {...field} />
                    </FormControl>
                    <FormDescription>
                      La grilla muestra todas las categorías raíz activas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex flex-col">
                    <FormLabel className="text-sm font-medium">Activo</FormLabel>
                    <FormDescription>
                      Si está apagado, el bloque no se muestra en la home.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Las fechas se interpretan en <strong>UTC</strong>. Dejá los
              campos vacíos para que el bloque se muestre sin límite.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visible desde (UTC)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visible hasta (UTC)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending || uploading}>
            {pending ? "Guardando…" : "Guardar bloque"}
          </Button>
          <Link
            href="/admin/contenido"
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Form>
  );
}
