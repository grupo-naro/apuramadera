"use client";

/**
 * Formulario de categoría del panel admin (React Hook Form + Zod).
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { slugify } from "@/core/lib/utils";
import { saveCategory } from "@/core/modules/catalog/catalog.admin.categories.actions";
import {
  categoryFormSchema,
  NO_PARENT,
  type CategoryFormInput,
} from "@/core/modules/catalog/catalog.admin.schemas";
import type {
  AdminCategoryForEdit,
  CategoryOption,
} from "@/core/modules/catalog/catalog.admin.types";
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
import { Switch } from "@/core/ui/switch";
import { Textarea } from "@/core/ui/textarea";

const EMPTY_VALUES: CategoryFormInput = {
  name: "",
  slug: "",
  description: "",
  parentId: NO_PARENT,
  sortOrder: "0",
  isActive: true,
};

interface CategoryFormProps {
  category?: AdminCategoryForEdit;
  /** Categorías que pueden ser padre (sin la propia ni sus hijas). */
  parentOptions: CategoryOption[];
}

export function CategoryForm({ category, parentOptions }: CategoryFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const categoryId = category?.id ?? null;

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category ?? EMPTY_VALUES,
  });

  function onSubmit(values: CategoryFormInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveCategory(categoryId, values);
      if (result.ok) {
        router.push("/admin/categorias");
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
        className="flex max-w-xl flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Datos de la categoría</CardTitle>
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
                    <Input placeholder="remeras" {...field} />
                  </FormControl>
                  <FormDescription>
                    Filtra el listado: /productos?category={field.value || "slug"}
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
                    <Textarea rows={3} placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría padre</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>
                        Sin categoría padre (raíz)
                      </SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {"   ".repeat(option.depth)}
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Menor número, primero.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activa</FormLabel>
                    <FormControl>
                      <div className="flex h-9 items-center">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Las inactivas no se ven en la tienda.
                    </FormDescription>
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
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar categoría"}
          </Button>
          <Link
            href="/admin/categorias"
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Form>
  );
}
