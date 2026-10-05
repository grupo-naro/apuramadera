import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const rootDir = import.meta.dirname;

/**
 * Tests unitarios (lógica pura). Los E2E de Playwright viven en `e2e/`
 * y NO los corre vitest — de ahí el `include` acotado a `src/`.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    // Valor fijo para las URLs de Cloudinary en los tests — el módulo
    // `config.ts` lee esta env var al cargar.
    env: {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "test-cloud",
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
});
