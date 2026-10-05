"use client";

/**
 * Vista AR de la PDP: "ver el mueble en tu baño".
 *
 * Renderiza `<model-viewer>` (custom element de `@google/model-viewer`,
 * importado sólo en cliente y bajo demanda). En el celular, el botón
 * "Ver en tu baño" abre el AR nativo — Scene Viewer en Android, Quick
 * Look en iPhone (este último necesita el `.usdz`). En desktop se ve
 * el modelo 3D girable y el botón AR no aparece.
 *
 * `src` / `ios-src` / `poster` / `alt` se fijan por `ref` como
 * atributos: React 19 pasa esos nombres al custom element como
 * propiedades y `<model-viewer>` no siempre las refleja al DOM.
 */
import { useEffect, useRef, useState } from "react";

import {
  buildCloudinaryRawUrl,
  buildCloudinaryUrl,
} from "@/core/integrations/cloudinary/transform";

interface ProductARProps {
  /** `publicId` del `.glb` (obligatorio — sin esto no se renderiza). */
  glbPublicId: string;
  /** `publicId` del `.usdz`; sin él, iPhone queda sin botón AR. */
  usdzPublicId: string | null;
  productName: string;
  /** Imagen de póster mientras carga el modelo. */
  posterPublicId?: string | null;
}

type Status = "loading" | "ready" | "error";

/**
 * URL de un asset de modelo. Igual que `StoreImage`: un `publicId` que
 * empieza con `/` es un archivo local de `public/` y se sirve tal cual
 * (útil para probar sin subir a Cloudinary); el resto va por
 * `buildCloudinaryRawUrl`.
 */
function modelAssetUrl(publicId: string): string {
  return publicId.startsWith("/") ? publicId : buildCloudinaryRawUrl(publicId);
}

export function ProductAR({
  glbPublicId,
  usdzPublicId,
  productName,
  posterPublicId,
}: ProductARProps) {
  const ref = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  const src = modelAssetUrl(glbPublicId);
  const iosSrc = usdzPublicId ? modelAssetUrl(usdzPublicId) : null;
  const poster =
    posterPublicId && !posterPublicId.startsWith("/")
      ? buildCloudinaryUrl(posterPublicId, { width: 800, crop: "limit" })
      : (posterPublicId ?? null);

  useEffect(() => {
    let active = true;
    void import("@google/model-viewer")
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || status !== "ready") return;
    el.setAttribute("src", src);
    el.setAttribute("alt", `Modelo 3D de ${productName}`);
    el.toggleAttribute("ar", true);
    if (iosSrc) el.setAttribute("ios-src", iosSrc);
    else el.removeAttribute("ios-src");
    if (poster) el.setAttribute("poster", poster);
    else el.removeAttribute("poster");
  }, [status, src, iosSrc, poster, productName]);

  const frameClass =
    "h-[420px] w-full rounded-sm border border-border/70 bg-muted";

  if (status === "error") return null;

  if (status === "loading") {
    return (
      <div
        className={`${frameClass} flex items-center justify-center text-sm text-muted-foreground`}
      >
        Cargando vista 3D…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <model-viewer
        ref={ref}
        ar-modes="scene-viewer quick-look webxr"
        ar-placement="floor"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
        className={frameClass}
      >
        <button
          slot="ar-button"
          type="button"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
        >
          Ver en tu baño
        </button>
      </model-viewer>
      <p className="text-xs text-muted-foreground">
        Girá el modelo para verlo desde todos los ángulos. Desde el celular
        podés colocarlo a escala real en tu baño.
      </p>
    </div>
  );
}
