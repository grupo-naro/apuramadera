import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { listCategoryOptions } from "@/core/modules/catalog/catalog.admin.repository";
import {
  HOME_BLOCK_TYPE_LABELS,
  HOME_BLOCK_TYPES,
  type HomeBlockType,
} from "@/core/modules/cms/cms.schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { BlockForm } from "@/features/admin/block-form";

export const metadata: Metadata = {
  title: "Nuevo bloque",
  robots: { index: false },
};

const TYPE_DESCRIPTIONS: Record<HomeBlockType, string> = {
  HERO_BANNER: "Imagen grande con título y un botón a la vista.",
  PRODUCT_CAROUSEL:
    "Una tira horizontal de productos, de una categoría o los más nuevos.",
  CATEGORY_GRID: "Tarjetas grandes hacia las categorías raíz de la tienda.",
};

function isValidType(value: string | undefined): value is HomeBlockType {
  return HOME_BLOCK_TYPES.includes(value as HomeBlockType);
}

interface NewBlockPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewBlockPage({ searchParams }: NewBlockPageProps) {
  const { type } = await searchParams;

  // Sin tipo → mostrar el selector.
  if (!isValidType(type)) {
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
            Nuevo bloque
          </h1>
          <p className="text-sm text-muted-foreground">
            Elegí qué tipo de bloque querés agregar a la home.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_BLOCK_TYPES.map((blockType) => (
            <Link
              key={blockType}
              href={`/admin/contenido/nuevo?type=${blockType}`}
              className="block"
            >
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle>{HOME_BLOCK_TYPE_LABELS[blockType]}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {TYPE_DESCRIPTIONS[blockType]}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const categories = await listCategoryOptions();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/admin/contenido/nuevo"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Tipos de bloque
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Nuevo {HOME_BLOCK_TYPE_LABELS[type].toLowerCase()}
        </h1>
      </div>
      <BlockForm type={type} categories={categories} />
    </div>
  );
}
