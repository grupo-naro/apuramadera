import type { Metadata } from "next";

import { listCategoryOptions } from "@/core/modules/catalog/catalog.admin.repository";
import { ProductForm } from "@/features/admin/product-form";

export const metadata: Metadata = {
  title: "Nuevo producto",
  robots: { index: false },
};

export default async function NewProductPage() {
  const categories = await listCategoryOptions();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
