import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { getHomeBlocks } from "@/core/modules/cms";
import { HomeBlocks } from "@/features/cms/home-blocks";

export const metadata: Metadata = {
  title: "Vista previa",
  robots: { index: false },
};

export default async function ContentPreviewPage() {
  // En modo preview se ignoran las ventanas startsAt/endsAt — el admin
  // ve también los bloques programados a futuro.
  const blocks = await getHomeBlocks(true);

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/admin/contenido"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Volver al editor
        </Link>
        <p className="text-xs text-muted-foreground">
          Vista previa — incluye bloques activos aunque todavía no estén en su
          ventana de programación.
        </p>
      </div>

      {blocks.length === 0 ? (
        <p className="p-12 text-center text-sm text-muted-foreground">
          No hay bloques activos para previsualizar.
        </p>
      ) : (
        <HomeBlocks blocks={blocks} />
      )}
    </div>
  );
}
