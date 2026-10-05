"use client";

/** Galería de imágenes de la PDP: imagen principal + thumbnails clickeables. */
import { useState } from "react";

import { cn } from "@/core/lib/utils";
import type { ProductImage } from "@/core/modules/catalog";
import { StoreImage } from "@/core/ui/store-image";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-sm border border-border/70 bg-muted text-sm text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-sm border border-border/70 bg-muted">
        <StoreImage
          src={active.publicId}
          alt={active.alt ?? productName}
          preset="gallery"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "relative aspect-square w-20 overflow-hidden rounded-sm border border-border/70 transition-opacity",
                index === activeIndex
                  ? "ring-1 ring-foreground"
                  : "opacity-60 hover:opacity-100",
              )}
            >
              <StoreImage
                src={image.publicId}
                alt={image.alt ?? ""}
                preset="thumbnail"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
