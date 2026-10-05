/**
 * Tipado del custom element `<model-viewer>` (`@google/model-viewer`)
 * para usarlo en JSX. Sólo declara los atributos que consume
 * `product-ar.tsx`. En React 19 el namespace `JSX` vive en el módulo
 * `react`, de ahí la augmentación.
 */
import type { DetailedHTMLProps, HTMLAttributes } from "react";

interface ModelViewerAttributes
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  src?: string;
  "ios-src"?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-placement"?: string;
  "camera-controls"?: boolean;
  "touch-action"?: string;
  "shadow-intensity"?: string | number;
  loading?: "auto" | "lazy" | "eager";
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
