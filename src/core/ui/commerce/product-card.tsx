/**
 * ProductCard — la card de producto para grillas y listados.
 *
 * Server Component (sin interactividad). Recibe un `ProductListItem`
 * del módulo catalog. El `ProductCardSkeleton` acompaña los estados
 * de carga con streaming del storefront (M1.4).
 */
import Link from "next/link";

import { discountPercent } from "@/core/lib/format";
import { cn } from "@/core/lib/utils";
import type { ProductListItem } from "@/core/modules/catalog";
import { Badge } from "@/core/ui/badge";
import { Skeleton } from "@/core/ui/skeleton";
import { StoreImage } from "@/core/ui/store-image";

import { Price } from "./price";

interface ProductCardProps {
  product: ProductListItem;
  className?: string;
  /**
   * Marca la imagen como `priority` (precarga + sin lazy load). Activar
   * sólo en las primeras cards del listado (LCP candidates).
   */
  priority?: boolean;
}

export function ProductCard({ product, className, priority }: ProductCardProps) {
  const { min, max } = product.priceRange;
  const isRange = min !== max;
  const discount = isRange
    ? null
    : discountPercent(min, product.compareAtPrice);

  return (
    <Link
      href={`/productos/${product.slug}`}
      className={cn(
        "group flex flex-col gap-3 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-sm border border-border/70 bg-muted">
        {product.image ? (
          <StoreImage
            src={product.image.publicId}
            alt={product.image.alt ?? product.name}
            preset="card"
            priority={priority}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sin imagen
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount !== null && (
            <span className="bg-foreground px-1.5 py-0.5 text-[0.68rem] font-medium tracking-wide text-background">
              −{discount}%
            </span>
          )}
          {!product.inStock && (
            <Badge
              variant="outline"
              className="rounded-none bg-background/90 text-[0.68rem] font-normal uppercase tracking-[0.14em]"
            >
              Sin stock
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug decoration-1 underline-offset-4 group-hover:underline">
          {product.name}
        </h3>
        {isRange ? (
          <span className="inline-flex items-baseline gap-1 text-sm">
            <span className="text-muted-foreground">Desde</span>
            <Price amount={min} size="md" />
          </span>
        ) : (
          <Price amount={min} compareAt={product.compareAtPrice} size="md" />
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-2 pt-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    </div>
  );
}
