import type { Metadata } from "next";
import Link from "next/link";
import { PackageIcon, PlusIcon } from "lucide-react";

import { formatPrice } from "@/core/lib/format";
import { listAdminProducts } from "@/core/modules/catalog/catalog.admin.repository";
import { buttonVariants } from "@/core/ui/button";
import { ProductStatusBadge } from "@/core/ui/commerce/product-status-badge";
import { StoreImage } from "@/core/ui/store-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";

export const metadata: Metadata = {
  title: "Productos",
  robots: { index: false },
};

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {products.length === 0
              ? "Sin productos todavía."
              : `${products.length} producto${products.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className={buttonVariants()}>
          <PlusIcon className="size-4" />
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <PackageIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Creá tu primer producto para que aparezca en la tienda.
          </p>
          <Link
            href="/admin/productos/nuevo"
            className={buttonVariants({ variant: "outline" })}
          >
            <PlusIcon className="size-4" />
            Nuevo producto
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {product.imagePublicId && (
                          <StoreImage
                            src={product.imagePublicId}
                            alt={product.name}
                            preset="thumbnail"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium hover:underline">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          /{product.slug}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.totalStock}
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
