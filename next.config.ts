import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fijamos la raíz del proyecto: hay lockfiles fuera de /web que
  // hacían que Turbopack infiriera mal el workspace root.
  turbopack: {
    root: __dirname,
  },
  // Las imágenes se sirven vía el loader de Cloudinary (StoreImage),
  // que evita el optimizador de Next — no hace falta `remotePatterns`.

  // Los `.usdz` servidos localmente desde `public/` (modelos 3D de
  // prueba) salen como `application/octet-stream`; iOS AR Quick Look
  // espera este content-type.
  async headers() {
    return [
      {
        source: "/:path*.usdz",
        headers: [
          { key: "Content-Type", value: "model/vnd.usdz+zip" },
        ],
      },
    ];
  },
};

// Bundle analyzer (M7.4) — `ANALYZE=true pnpm build` abre el reporte
// en el browser; sin la env var es no-op.
export default bundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
