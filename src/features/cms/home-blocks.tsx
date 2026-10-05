/**
 * Renderer dinámico de la home — mapea cada bloque del CMS a su
 * componente según el tipo. Sumar un tipo nuevo = un `case` más.
 */
import type { HomeBlock } from "@/core/modules/cms";

import { CategoryGridBlock } from "./category-grid-block";
import { HeroBannerBlock } from "./hero-banner-block";
import { ProductCarouselBlock } from "./product-carousel-block";

export function HomeBlocks({ blocks }: { blocks: HomeBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case "HERO_BANNER":
            return <HeroBannerBlock key={block.id} data={block.data} />;
          case "PRODUCT_CAROUSEL":
            return <ProductCarouselBlock key={block.id} data={block.data} />;
          case "CATEGORY_GRID":
            return <CategoryGridBlock key={block.id} data={block.data} />;
        }
      })}
    </>
  );
}
