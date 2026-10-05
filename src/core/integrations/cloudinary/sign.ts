/**
 * Firma de uploads a Cloudinary.
 *
 * Cloudinary firma con: sha1 de los parámetros a firmar ordenados
 * alfabéticamente como `clave=valor` unidos por `&`, con el
 * `api_secret` concatenado al final.
 *
 * Compartido por el upload firmado desde el navegador
 * (`getUploadSignature`) y el upload `raw` desde el server
 * (`uploadRawToCloudinary`).
 */
import { createHash } from "node:crypto";

export function cloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}
