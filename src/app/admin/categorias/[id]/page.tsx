import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAdminCategoryForEdit,
  listParentOptions,
} from "@/core/modules/catalog/catalog.admin.categories.repository";
import { CategoryForm } from "@/features/admin/category-form";
import { DeleteCategoryButton } from "@/features/admin/delete-category-button";

export const metadata: Metadata = {
  title: "Editar categoría",
  robots: { index: false },
};

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const [category, parentOptions] = await Promise.all([
    getAdminCategoryForEdit(id),
    listParentOptions(id),
  ]);

  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar categoría
          </h1>
          <p className="text-sm text-muted-foreground">{category.name}</p>
        </div>
        <DeleteCategoryButton
          categoryId={category.id}
          categoryName={category.name}
        />
      </div>
      <CategoryForm category={category} parentOptions={parentOptions} />
    </div>
  );
}
