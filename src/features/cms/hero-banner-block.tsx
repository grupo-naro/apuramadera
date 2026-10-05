/**
 * Bloque "Banner principal" — imagen apaisada con título, bajada y CTA.
 */
import Link from "next/link";

import { cn } from "@/core/lib/utils";
import type { HeroBannerData } from "@/core/modules/cms";
import { buttonVariants } from "@/core/ui/button";
import { StoreImage } from "@/core/ui/store-image";

export function HeroBannerBlock({ data }: { data: HeroBannerData }) {
  return (
    <section className="relative aspect-16/7 w-full overflow-hidden bg-muted">
      <StoreImage
        src={data.imagePublicId}
        alt={data.imageAlt || data.heading}
        preset="banner"
        priority
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {data.heading}
        </h2>
        {data.subheading && (
          <p className="max-w-xl text-sm text-white/90 sm:text-base">
            {data.subheading}
          </p>
        )}
        {data.ctaLabel && data.ctaHref && (
          <Link
            href={data.ctaHref}
            className={cn(buttonVariants({ size: "lg" }), "mt-2")}
          >
            {data.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
