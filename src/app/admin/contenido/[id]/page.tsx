import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { listCategoryOptions } from "@/core/modules/catalog/catalog.admin.repository";
import { getBlockForEdit } from "@/core/modules/cms/cms.repository";
import { HOME_BLOCK_TYPE_LABELS } from "@/core/modules/cms/cms.schemas";
import { BlockForm } from "@/features/admin/block-form";

export const metadata: Metadata = {
  title: "Editar bloque",
  robots: { index: false },
};

interface EditBlockPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlockPage({ params }: EditBlockPageProps) {
  const { id } = await params;
  const [block, categories] = await Promise.all([
    getBlockForEdit(id),
    listCategoryOptions(),
  ]);

  if (!block) notFound();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/contenido"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Contenido
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Editar {HOME_BLOCK_TYPE_LABELS[block.type].toLowerCase()}
        </h1>
      </div>
      <BlockForm type={block.type} block={block} categories={categories} />
    </div>
  );
}
