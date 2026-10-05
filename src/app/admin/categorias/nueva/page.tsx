import type { Metadata } from "next";

import { listParentOptions } from "@/core/modules/catalog/catalog.admin.categories.repository";
import { CategoryForm } from "@/features/admin/category-form";

export const metadata: Metadata = {
  title: "Nueva categoría",
  robots: { index: false },
};

export default async function NewCategoryPage() {
  const parentOptions = await listParentOptions();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Nueva categoría</h1>
      <CategoryForm parentOptions={parentOptions} />
    </div>
  );
}
