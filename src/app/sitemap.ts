import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/core/lib/seo";
import {
  getCategoryTree,
  listProductSlugs,
  type CategoryTreeNode,
} from "@/core/modules/catalog";

// Se regenera cada hora (los productos nuevos aparecen sin redeploy).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categoryTree] = await Promise.all([
    listProductSlugs(),
    getCategoryTree(),
  ]);
  

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/productos"), changeFrequency: "daily", priority: 0.9 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/productos/${product.slug}`),
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Aplana el árbol de categorías.
  const categoryRoutes: MetadataRoute.Sitemap = [];
  const walk = (nodes: CategoryTreeNode[]) => {
    for (const node of nodes) {
      categoryRoutes.push({
        url: absoluteUrl(`/productos?category=${node.slug}`),
        changeFrequency: "weekly",
        priority: 0.6,
      });
      walk(node.children);
    }
  };
  walk(categoryTree);

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
