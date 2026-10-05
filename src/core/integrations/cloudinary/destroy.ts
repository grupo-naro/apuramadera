/**
 * Borrado de assets en Cloudinary (Admin API).
 *
 * Server-side only: usa `CLOUDINARY_API_SECRET`. A propósito NO es un
 * archivo `"use server"` (no se puede invocar desde el navegador) y no
 * se re-exporta desde el barrel, que también lo importan componentes
 * cliente. Se importa directo desde el código server que lo necesita.
 *
 * Sin credenciales configuradas no hace nada (la feature queda
 * apagada, igual que el resto de las integraciones opcionales).
 */

/** Límite de `public_ids` por request del Admin API. */
const BATCH_SIZE = 100;

export interface CloudinaryAssets {
  /** `public_id`s de imágenes. */
  image?: string[];
  /** `public_id`s de assets `raw` (modelos 3D `.glb` / `.usdz`). */
  raw?: string[];
}

async function deleteBatch(
  cloudName: string,
  credentials: string,
  resourceType: "image" | "raw",
  publicIds: string[],
): Promise<void> {
  const params = new URLSearchParams({ invalidate: "true" });
  for (const id of publicIds) params.append("public_ids[]", id);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload?${params}`,
    {
      method: "DELETE",
      headers: { Authorization: `Basic ${credentials}` },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Cloudinary no pudo borrar assets ${resourceType} (HTTP ${response.status}).`,
    );
  }
}

/** Borra los assets indicados. Lanza si Cloudinary responde con error. */
export async function deleteCloudinaryAssets(
  assets: CloudinaryAssets,
): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  if (!cloudName || !apiKey || !apiSecret) return;

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  for (const resourceType of ["image", "raw"] as const) {
    const ids = assets[resourceType] ?? [];
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      await deleteBatch(
        cloudName,
        credentials,
        resourceType,
        ids.slice(i, i + BATCH_SIZE),
      );
    }
  }
}
