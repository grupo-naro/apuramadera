import type { Metadata } from "next";
import Link from "next/link";
import { FolderTreeIcon, PlusIcon } from "lucide-react";

import { listAdminCategories } from "@/core/modules/catalog/catalog.admin.categories.repository";
import { Badge } from "@/core/ui/badge";
import { buttonVariants } from "@/core/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";

export const metadata: Metadata = {
  title: "Categorías",
  robots: { index: false },
};

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length === 0
              ? "Sin categorías todavía."
              : `${categories.length} categoría${categories.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link href="/admin/categorias/nueva" className={buttonVariants()}>
          <PlusIcon className="size-4" />
          Nueva categoría
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <FolderTreeIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Organizá el catálogo creando categorías.
          </p>
          <Link
            href="/admin/categorias/nueva"
            className={buttonVariants({ variant: "outline" })}
          >
            <PlusIcon className="size-4" />
            Nueva categoría
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Productos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Link
                      href={`/admin/categorias/${category.id}`}
                      className="block"
                      style={{ paddingLeft: `${category.depth * 1.5}rem` }}
                    >
                      <span className="font-medium hover:underline">
                        {category.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        /{category.slug}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "outline"}>
                      {category.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {category.productCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
