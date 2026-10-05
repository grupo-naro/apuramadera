/**
 * Configuración de Cloudinary.
 *
 * El cloud name se expone al cliente (`NEXT_PUBLIC_`) porque las URLs
 * de imágenes se arman en el browser, dentro del loader de next/image.
 * En la Fase 4 cada tienda lo define en su `store.config.ts` / entorno.
 */
export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export const isCloudinaryConfigured = CLOUDINARY_CLOUD_NAME.length > 0;
