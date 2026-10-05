import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright para los E2E críticos del storefront
 * (M7.3). Arranca `next dev` en localhost:3000 y corre los specs en
 * Chromium — alcance acotado: home, add-to-cart, checkout completo.
 *
 * Los tests dependen de que haya al menos UN producto activo en stock
 * en la base. Si el seed no se corrió, fallan con un mensaje claro.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // los tests comparten el carrito de la cookie
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
