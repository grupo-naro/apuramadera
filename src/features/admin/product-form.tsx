"use client";

/**
 * Formulario de producto del panel admin (React Hook Form + Zod).
 *
 * Un producto puede ser simple (precio/stock directos) o variable
 * (opciones + lista manual de variantes — ver `VariantsEditor`). El
 * toggle "tiene variantes" alterna entre ambos. M3.3c sumará las
 * imágenes.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { slugify } from "@/core/lib/utils";
import { saveProduct } from "@/core/modules/catalog/catalog.admin.actions";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUSES,
  productFormSchema,
  type ProductFormInput,
} from "@/core/modules/catalog/catalog.admin.schemas";
import type {
  AdminProductForEdit,
  CategoryOption,
} from "@/core/modules/catalog/catalog.admin.types";
import { Button, buttonVariants } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { Checkbox } from "@/core/ui/checkbox";
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
import { Switch } from "@/core/ui/switch";
import { Textarea } from "@/core/ui/textarea";

import { ProductImagesEditor } from "./product-images-editor";
import { ProductModel3DEditor } from "./product-model-3d-editor";
import { VariantsEditor } from "./variants-editor";

const EMPTY_VALUES: ProductFormInput = {
  name: "",
  slug: "",
  description: "",
  status: "DRAFT",
  metaTitle: "",
  metaDescription: "",
  categoryIds: [],
  images: [],
  modelGlbPublicId: "",
  modelUsdzPublicId: "",
  hasVariants: false,
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  options: [],
  variants: [],
};

interface ProductFormProps {
  /** Producto a editar, o `undefined` para crear uno nuevo. */
  product?: AdminProductForEdit;
  categories: CategoryOption[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const productId = product?.id ?? null;

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ?? EMPTY_VALUES,
  });

  const hasVariants = useWatch({ control: form.control, name: "hasVariants" });

  function onSubmit(values: ProductFormInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveProduct(productId, values);
      if (result.ok) {
        router.push("/admin/productos");
        return;
      }
      setServerError(result.error);
      if (result.field === "slug") {
        form.setError("slug", { message: result.error });
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-w-2xl flex-col gap-6"
      >
        {/* ── Datos generales ── */}
        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onBlur={(event) => {
                        field.onBlur();
                        if (!form.getValues("slug")) {
                          form.setValue("slug", slugify(event.target.value), {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="remera-oversize" {...field} />
                  </FormControl>
                  <FormDescription>
                    La URL del producto: /productos/{field.value || "slug"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {PRODUCT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Sólo los productos publicados se ven en la tienda.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <ProductImagesEditor />

        <ProductModel3DEditor />

        {/* ── Precio / variantes ── */}
        <Card>
          <CardHeader>
            <CardTitle>Precio y stock</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span className="flex flex-col">
                <span className="text-sm font-medium">
                  Este producto tiene variantes
                </span>
                <span className="text-xs text-muted-foreground">
                  Talles, colores u otras combinaciones, cada una con su
                  precio y stock.
                </span>
              </span>
              <Switch
                checked={hasVariants}
                onCheckedChange={(checked) =>
                  form.setValue("hasVariants", checked)
                }
              />
            </label>

            {!hasVariants && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio (pesos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="compareAtPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de lista (pesos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            placeholder="Opcional — precio tachado"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Opcional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {hasVariants && <VariantsEditor />}

        {/* ── Categorías ── */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Todavía no hay categorías.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {categories.map((category) => {
                        const checked = field.value.includes(category.id);
                        return (
                          <label
                            key={category.id}
                            className="flex cursor-pointer items-center gap-2.5 text-sm"
                            style={{
                              paddingLeft: `${category.depth * 1.25}rem`,
                            }}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                field.onChange(
                                  value === true
                                    ? [...field.value, category.id]
                                    : field.value.filter(
                                        (id) => id !== category.id,
                                      ),
                                );
                              }}
                            />
                            {category.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── SEO ── */}
        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta título</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormDescription>
                    Si se deja vacío, se usa el nombre del producto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar producto"}
          </Button>
          <Link
            href="/admin/productos"
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Form>
  );
}
