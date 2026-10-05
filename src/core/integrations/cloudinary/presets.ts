/**
 * Presets de imagen.
 *
 * Cada preset define el aspecto del recorte y el hint `sizes` que usa
 * next/image para elegir qué ancho del srcset bajar. Los componentes
 * piden un preset por nombre — no manejan tamaños sueltos.
 */
export type ImagePreset =
  | "thumbnail"
  | "card"
  | "gallery"
  | "zoom"
  | "banner";

export interface ImagePresetConfig {
  /** Relación de aspecto del recorte. */
  aspectRatio: string;
  /** Hint `sizes` para next/image: cuánto espacio ocupa la imagen. */
  sizes: string;
}

export const IMAGE_PRESETS: Record<ImagePreset, ImagePresetConfig> = {
  // Miniatura — selector de imágenes de la PDP.
  thumbnail: { aspectRatio: "1:1", sizes: "80px" },
  // Card de producto en grillas y listados.
  card: {
    aspectRatio: "1:1",
    sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  },
  // Imagen principal de la PDP.
  gallery: { aspectRatio: "1:1", sizes: "(min-width: 1024px) 50vw, 100vw" },
  // Vista ampliada (zoom de imagen — se usará más adelante).
  zoom: { aspectRatio: "1:1", sizes: "100vw" },
  // Banner principal de la home (CMS · M5.1) — apaisado, full-width.
  banner: { aspectRatio: "16:7", sizes: "100vw" },
};
