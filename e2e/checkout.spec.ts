import { expect, test } from "@playwright/test";

/**
 * Flow completo de compra: agregar al carrito → checkout → submit con
 * "Retiro en el local" (sin dirección) → llegar a la página de la orden.
 * Crea una orden REAL en la base — los tests no limpian. Documentado.
 */
test("checkout con retiro en el local crea una orden y redirige a /orden/:id", async ({
  page,
}) => {
  // 1) Agregar un producto al carrito.
  await page.goto("/productos");
  await page.locator('a[href^="/productos/"]').first().click();
  await expect(page).toHaveURL(/\/productos\/[^/]+$/);
  const addButton = page.getByRole("button", { name: /agregar al carrito/i });
  await expect(addButton).toBeEnabled({ timeout: 20_000 });
  await addButton.click();

  // Confirmamos el item antes de seguir.
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("heading", { name: /tu carrito \(\d+\)/i }),
  ).toBeVisible();

  // 2) Ir al checkout.
  await page.goto("/checkout");
  await expect(page.getByText(/datos de contacto/i)).toBeVisible();

  // 3) Datos de contacto.
  await page.getByLabel(/email/i).fill("e2e@example.test");
  await page.getByLabel(/nombre y apellido/i).fill("E2E Tester");
  await page.getByLabel(/teléfono/i).fill("1122334455");

  // 4) Método de envío — retiro en el local (es el primer radio).
  const pickupRadio = page.getByLabel(/retiro en el local/i);
  await pickupRadio.click();

  // 5) Submit por canal "online" (sin MP conectado, redirige a /orden/:id).
  await page.getByRole("button", { name: /confirmar pedido/i }).click();

  // 6) Llegamos a la orden — el id va en la URL.
  await expect(page).toHaveURL(/\/orden\/[a-z0-9]+/i, { timeout: 30_000 });
  await expect(page.getByText(/¡gracias por tu compra/i)).toBeVisible();
});
