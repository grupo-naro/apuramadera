import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAdminProductForEdit,
  listCategoryOptions,
} from "@/core/modules/catalog/catalog.admin.repository";
import { DeleteProductButton } from "@/features/admin/delete-product-button";
import { ProductForm } from "@/features/admin/product-form";

export const metadata: Metadata = {
  title: "Editar producto",
  robots: { index: false },
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProductForEdit(id),
    listCategoryOptions(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar producto</h1>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
        <DeleteProductButton productId={product.id} productName={product.name} />
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
