"use client";

/**
 * StoreImage — imagen de producto optimizada vía Cloudinary.
 *
 * Envuelve next/image con un loader de Cloudinary: next/image arma el
 * srcset responsive y Cloudinary sirve cada ancho con `f_auto`/`q_auto`
 * y el recorte del preset. Siempre usa `fill` — el contenedor padre
 * (que debe ser `relative`) define el tamaño.
 *
 * Escotilla local: si `src` empieza con `/`, es un asset de `public/`
 * (fotos del seed en dev, sin credenciales de Cloudinary para subir).
 * En ese caso se usa el loader por defecto de next/image y se ignora
 * el preset de Cloudinary.
 */
import Image, { type ImageLoader } from "next/image";

import {
  buildCloudinaryUrl,
  IMAGE_PRESETS,
  type ImagePreset,
} from "@/core/integrations/cloudinary";
import { cn } from "@/core/lib/utils";

interface StoreImageProps {
  /** public_id del asset en Cloudinary. */
  src: string;
  alt: string;
  preset: ImagePreset;
  priority?: boolean;
  className?: string;
}

export function StoreImage({
  src,
  alt,
  preset,
  priority,
  className,
}: StoreImageProps) {
  const config = IMAGE_PRESETS[preset];

  // Asset local de `public/` — sin Cloudinary.
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={config.sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  const loader: ImageLoader = ({ src: publicId, width }) =>
    buildCloudinaryUrl(publicId, {
      width,
      crop: "fill",
      aspectRatio: config.aspectRatio,
    });

  // Placeholder: versión diminuta y desenfocada del mismo asset.
  const blurDataURL = buildCloudinaryUrl(src, {
    width: 24,
    crop: "fill",
    aspectRatio: config.aspectRatio,
    blur: 800,
  });

  return (
    <Image
      loader={loader}
      src={src}
      alt={alt}
      fill
      sizes={config.sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={blurDataURL}
      className={cn("object-cover", className)}
    />
  );
}
