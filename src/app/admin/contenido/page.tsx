import type { Metadata } from "next";
import Link from "next/link";
import { EyeIcon, LayoutTemplateIcon, PlusIcon } from "lucide-react";

import { listAdminBlocks } from "@/core/modules/cms/cms.repository";
import { buttonVariants } from "@/core/ui/button";
import { BlockRow } from "@/features/admin/block-row";

export const metadata: Metadata = {
  title: "Contenido",
  robots: { index: false },
};

export default async function AdminContentPage() {
  const blocks = await listAdminBlocks();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contenido</h1>
          <p className="text-sm text-muted-foreground">
            Bloques de la home — el orden de la lista es el orden en que se
            muestran.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/contenido/preview"
            className={buttonVariants({ variant: "outline" })}
          >
            <EyeIcon className="size-4" />
            Vista previa
          </Link>
          <Link href="/admin/contenido/nuevo" className={buttonVariants()}>
            <PlusIcon className="size-4" />
            Nuevo bloque
          </Link>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <LayoutTemplateIcon className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Todavía no hay bloques. Creá el primero para armar la home.
          </p>
          <Link
            href="/admin/contenido/nuevo"
            className={buttonVariants({ variant: "outline" })}
          >
            <PlusIcon className="size-4" />
            Nuevo bloque
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="flex flex-col divide-y">
            {blocks.map((block, index) => (
              <BlockRow
                key={block.id}
                block={block}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
