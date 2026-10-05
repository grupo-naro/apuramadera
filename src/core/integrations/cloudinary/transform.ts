/**
 * Constructor de URLs de Cloudinary.
 *
 * Arma una URL de entrega con transformaciones. Siempre incluye
 * `f_auto` (WebP/AVIF según el browser) y `q_auto` (calidad
 * automática) — la base de la optimización.
 */
import { CLOUDINARY_CLOUD_NAME } from "./config";

export interface CloudinaryTransform {
  /** Ancho en px. */
  width?: number;
  /** Relación de aspecto para el recorte, ej. "1:1". Requiere `crop: "fill"`. */
  aspectRatio?: string;
  /** `fill` recorta al tamaño pedido; `limit` sólo achica sin recortar. */
  crop?: "fill" | "limit";
  /** Calidad — por defecto "auto". */
  quality?: string | number;
  /** Desenfoque (para placeholders). */
  blur?: number;
}

export function buildCloudinaryUrl(
  publicId: string,
  transform: CloudinaryTransform = {},
): string {
  const parts: string[] = ["f_auto", `q_${transform.quality ?? "auto"}`];

  if (transform.crop) parts.push(`c_${transform.crop}`);
  if (transform.aspectRatio) parts.push(`ar_${transform.aspectRatio}`);
  if (transform.crop === "fill") parts.push("g_auto"); // recorte centrado en lo relevante
  if (transform.width) parts.push(`w_${transform.width}`);
  if (transform.blur) parts.push(`e_blur:${transform.blur}`);

  const transformation = parts.join(",");
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${encodeURI(publicId)}`;
}

/**
 * URL de entrega de un asset `raw` (no imagen) — modelos 3D `.glb` /
 * `.usdz`. Sin transformaciones: Cloudinary sirve el archivo tal cual.
 */
export function buildCloudinaryRawUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/raw/upload/${encodeURI(publicId)}`;
}
