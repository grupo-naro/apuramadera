/**
 * Integración Cloudinary — API pública.
 *
 * Entrega y transformación de imágenes (CDN, WebP/AVIF, resize). El
 * upload de imágenes desde el admin se suma en la Fase 3 (M3.3).
 */
export { CLOUDINARY_CLOUD_NAME, isCloudinaryConfigured } from "./config";
export { buildCloudinaryUrl, type CloudinaryTransform } from "./transform";
export {
  IMAGE_PRESETS,
  type ImagePreset,
  type ImagePresetConfig,
} from "./presets";
