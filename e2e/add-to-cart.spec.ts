import { expect, test } from "@playwright/test";

/**
 * Add-to-cart desde la PDP. Toma el primer producto activo en stock
 * del listado — robusto a cualquier vertical / catálogo cargado.
 */
test("agregar al carrito desde la PDP abre el drawer con el ítem", async ({
  page,
}) => {
  await page.goto("/productos");

  // Click en el primer link a una PDP (slug específico).
  const firstProductLink = page.locator('a[href^="/productos/"]').first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();
  await expect(page).toHaveURL(/\/productos\/[^/]+$/);

  // El VariantSelector auto-selecciona la primera variante con stock —
  // el botón ya debería estar habilitado sin tocar nada más.
  const addButton = page.getByRole("button", { name: /agregar al carrito/i });
  await expect(addButton).toBeEnabled({ timeout: 20_000 });
  await addButton.click();

  // Tras el click, `handleAddToCart` hace setCart + openCart — el drawer
  // se abre con la línea. Si quedara "vacío", sabríamos que addToCart falló.
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("heading", { name: /tu carrito \(\d+\)/i }),
  ).toBeVisible();
  await expect(drawer.getByText(/tu carrito está vacío/i)).not.toBeVisible();
});
