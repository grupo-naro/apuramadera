/**
 * Sube un archivo DIRECTO a Cloudinary usando una firma del server.
 *
 * Compartido entre los uploaders del panel (productos, banners, etc.).
 * El navegador es quien envía el archivo; el `api_secret` nunca sale
 * del server (vive en `getUploadSignature`).
 */
import { getUploadSignature } from "@/core/integrations/cloudinary/upload";

/**
 * Tipo de asset. `image` (default) para las fotos del producto; `raw`
 * para archivos que Cloudinary no procesa como imagen — los modelos
 * 3D `.glb` / `.usdz` de la vista AR. La firma del server sólo cubre
 * `folder` + `timestamp`, así que sirve igual para ambos: el
 * `resource_type` va en la URL, no entre los parámetros firmados.
 */
type CloudinaryResourceType = "image" | "raw";

interface UploadOptions {
  resourceType?: CloudinaryResourceType;
}

/** Sube `file` a Cloudinary y devuelve su `public_id`. */
export async function uploadToCloudinary(
  file: File,
  { resourceType = "image" }: UploadOptions = {},
): Promise<string> {
  const sig = await getUploadSignature();

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("folder", sig.folder);
  body.append("signature", sig.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
    { method: "POST", body },
  );
  if (!response.ok) {
    let detail = "";
    try {
      const err = (await response.json()) as { error?: { message?: string } };
      detail = err.error?.message ? ` — ${err.error.message}` : "";
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(
      `Cloudinary rechazó la subida (${response.status}${detail})`,
    );
  }
  const json = (await response.json()) as { public_id: string };
  return json.public_id;
}
