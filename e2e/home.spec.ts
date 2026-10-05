import { expect, test } from "@playwright/test";

import { storeConfig } from "../src/store.config";

/**
 * Smoke de la home: que cargue + que el título refleje la storeConfig
 * + que se pueda llegar al listado de productos.
 */
test.describe("home", () => {
  test("muestra el nombre de la tienda en el header y el title", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(new RegExp(storeConfig.name));
    await expect(
      page.getByRole("link", { name: storeConfig.name }).first(),
    ).toBeVisible();
  });

  test("se puede navegar al listado de productos", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /ver catálogo/i }).first().click();
    await expect(page).toHaveURL(/\/productos(\?|$)/);
  });
});
