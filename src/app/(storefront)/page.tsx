import type { Metadata } from "next";

import { getHomeBlocks } from "@/core/modules/cms";
import { HomeBlocks } from "@/features/cms/home-blocks";
import { ApuraHome } from "@/features/storefront/home/apura-home";
import { storeConfig } from "@/store.config";

// ISR: la home se regenera cada hora; el editor del panel (M5.2)
// además la revalida al guardar cambios.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `${storeConfig.name} · ${storeConfig.tagline}` },
  description: storeConfig.description,
};

export default async function HomePage() {
  const blocks = await getHomeBlocks();

  // Si el panel cargó bloques, mandan ellos. Si no, la home editorial
  // de la marca (hero + secciones + destacados del catálogo).
  if (blocks.length === 0) return <ApuraHome />;

  return <HomeBlocks blocks={blocks} />;
}
