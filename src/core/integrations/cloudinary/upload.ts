"use server";

/**
 * Upload firmado a Cloudinary (M3.3c).
 *
 * El navegador sube el archivo DIRECTO a Cloudinary — el server sólo
 * firma los parámetros con el `api_secret` (que nunca sale del
 * server). Esta acción se invoca desde el panel admin, así que queda
 * detrás del proxy que protege `/admin/*`.
 *
 * La firma en sí la arma `cloudinarySignature` (ver `sign.ts`).
 */
import { CLOUDINARY_CLOUD_NAME } from "./config";
import { cloudinarySignature } from "./sign";

const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";
const UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || "commerce-core";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** Firma los parámetros de un upload. Lanza si falta configuración. */
export async function getUploadSignature(): Promise<UploadSignature> {
  if (!CLOUDINARY_CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(
      "Cloudinary no está configurado — faltan CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.",
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinarySignature(
    { folder: UPLOAD_FOLDER, timestamp },
    API_SECRET,
  );

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    folder: UPLOAD_FOLDER,
    signature,
  };
}
