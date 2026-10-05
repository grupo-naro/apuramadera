import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { breadcrumbJsonLd, productJsonLd, productOgImage } from "@/core/lib/seo";
import { getProductBySlug, listProductSlugs } from "@/core/modules/catalog";
import { Breadcrumbs } from "@/core/ui/commerce";
import { JsonLd } from "@/core/ui/json-ld";
import { ProductAR } from "@/features/storefront/product-ar";
import { ProductGallery } from "@/features/storefront/product-gallery";
import { ProductPurchase } from "@/features/storefront/product-purchase";

// ISR: las PDP se prerenderizan y se revalidan cada hora.
export const revalidate = 3600;
// Productos creados después del build se renderizan on-demand.
export const dynamicParams = true;

// `cache` deduplica la consulta: generateMetadata y la página comparten
// el resultado dentro del mismo request.
const getProduct = cache(getProductBySlug);

type PageProps = { params: Promise<{ slug: string }> };

/** Pre-renderiza una PDP por cada producto publicado. */
export async function generateStaticParams() {
  const products = await listProductSlugs();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  // notFound() acá (durante la resolución del <head>, antes de que el
  // body haga stream) hace que la respuesta tenga status 404 real.
  if (!product) notFound();

  const title = product.metaTitle ?? product.name;
  const description =
    product.metaDescription ?? product.description ?? undefined;
  const path = `/productos/${product.slug}`;
  const ogImage = product.images[0]
    ? productOgImage(product.images[0].publicId)
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 1200, alt: product.name }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const primaryCategory = product.categories[0];

  const breadcrumbItems = [
    { label: "Inicio", path: "/" },
    { label: "Productos", path: "/productos" },
    ...(primaryCategory
      ? [
          {
            label: primaryCategory.name,
            path: `/productos?category=${primaryCategory.slug}`,
          },
        ]
      : []),
    { label: product.name, path: `/productos/${product.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd(
          breadcrumbItems.map((item) => ({
            name: item.label,
            path: item.path,
          })),
        )}
      />

      <Breadcrumbs
        className="mb-6"
        items={breadcrumbItems.map((item, index) => ({
          label: item.label,
          href: index < breadcrumbItems.length - 1 ? item.path : undefined,
        }))}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-4">
          <ProductGallery images={product.images} productName={product.name} />
          {product.modelGlbPublicId && (
            <ProductAR
              glbPublicId={product.modelGlbPublicId}
              usdzPublicId={product.modelUsdzPublicId}
              productName={product.name}
              posterPublicId={product.images[0]?.publicId}
            />
          )}
        </div>

        <div className="flex flex-col gap-6 lg:pt-4">
          {primaryCategory && (
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {primaryCategory.name}
            </span>
          )}
          <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <ProductPurchase product={product} />

          {product.description && (
            <div className="border-t border-border/70 pt-6">
              <h2 className="text-xs font-medium uppercase tracking-[0.18em]">
                Descripción
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
