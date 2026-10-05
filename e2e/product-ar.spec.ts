import "dotenv/config";
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import { Client } from "pg";

/**
 * Vista AR de la PDP. Verifica que `<model-viewer>` se renderiza con
 * las URLs correctas cuando el producto tiene un modelo 3D cargado, y
 * que NO aparece cuando no lo tiene.
 *
 * El test crea sus propios productos de fixture vía SQL y los borra al
 * terminar — no depende del seed. Se usa `pg` directo porque el cliente
 * Prisma generado no carga bajo el runner de Playwright.
 */
const STAMP = Date.now();
const WITH_MODEL = {
  id: randomUUID(),
  slug: `e2e-ar-with-${STAMP}`,
  glb: "e2e/ar-fixture.glb",
  usdz: "e2e/ar-fixture.usdz",
};
const WITHOUT_MODEL = {
  id: randomUUID(),
  slug: `e2e-ar-without-${STAMP}`,
};

async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function insertProduct(
  client: Client,
  p: { id: string; slug: string; glb?: string; usdz?: string },
) {
  await client.query(
    `INSERT INTO "Product"
       ("id", "name", "slug", "status", "modelGlbPublicId", "modelUsdzPublicId", "updatedAt")
     VALUES ($1, $2, $3, 'ACTIVE', $4, $5, now())`,
    [p.id, `E2E ${p.slug}`, p.slug, p.glb ?? null, p.usdz ?? null],
  );
  await client.query(
    `INSERT INTO "ProductVariant"
       ("id", "productId", "price", "stock", "isActive", "updatedAt")
     VALUES ($1, $2, 100000, 3, true, now())`,
    [randomUUID(), p.id],
  );
}

test.beforeAll(async () => {
  await withDb(async (client) => {
    await insertProduct(client, WITH_MODEL);
    await insertProduct(client, WITHOUT_MODEL);
  });
});

test.afterAll(async () => {
  // El FK de ProductVariant es onDelete: Cascade.
  await withDb((client) =>
    client.query(`DELETE FROM "Product" WHERE "slug" = ANY($1)`, [
      [WITH_MODEL.slug, WITHOUT_MODEL.slug],
    ]),
  );
});

test("la PDP con modelo 3D renderiza <model-viewer> apuntando a los assets raw", async ({
  page,
}) => {
  await page.goto(`/productos/${WITH_MODEL.slug}`);

  const viewer = page.locator("model-viewer");
  await expect(viewer).toBeAttached({ timeout: 15_000 });
  await expect(viewer).toHaveAttribute(
    "src",
    new RegExp(`/raw/upload/${WITH_MODEL.glb}$`),
  );
  await expect(viewer).toHaveAttribute(
    "ios-src",
    new RegExp(`/raw/upload/${WITH_MODEL.usdz}$`),
  );
});

test("una PDP sin modelo 3D no renderiza <model-viewer>", async ({ page }) => {
  await page.goto(`/productos/${WITHOUT_MODEL.slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: `E2E ${WITHOUT_MODEL.slug}` }),
  ).toBeVisible();

  await page.waitForLoadState("networkidle");
  await expect(page.locator("model-viewer")).toHaveCount(0);
});
