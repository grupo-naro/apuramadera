import "dotenv/config";

import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

/**
 * Login del panel (email + contraseña) y primer ingreso de un usuario
 * creado desde `/admin/usuarios`.
 *
 * Usa el admin principal de `.env`: primer email de `ADMIN_EMAILS` con
 * `ADMIN_INITIAL_PASSWORD`. Si ese admin ya cambió su clave en la base,
 * estos tests fallan al loguearse (hay que dejar la clave inicial o
 * resetear su `passwordHash`).
 */
const ADMIN_EMAIL = (process.env.ADMIN_EMAILS ?? "")
  .split(",")[0]
  ?.trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

test.skip(
  !ADMIN_EMAIL || !ADMIN_PASSWORD,
  "Faltan ADMIN_EMAILS / ADMIN_INITIAL_PASSWORD en .env",
);

/** Alertas de la página (excluye el anunciador de rutas de Next, que también es role=alert). */
function pageAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

/** Crea un usuario desde /admin/usuarios (la página ya debe tener sesión de admin). */
async function createUser(page: Page, email: string, dni: string) {
  await page.goto("/admin/usuarios");
  await page.getByLabel("Nombre").fill("Usuario E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("DNI").fill(dni);
  await page.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByText(`Usuario ${email} creado.`)).toBeVisible();
}

/** Elimina un usuario desde /admin/usuarios (fila → Eliminar → diálogo). */
async function deleteUser(page: Page, email: string) {
  await page.goto("/admin/usuarios");
  await page
    .getByRole("row", { name: new RegExp(email) })
    .getByRole("button", { name: "Eliminar" })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Eliminar" })
    .click();
  await expect(page.getByRole("row", { name: new RegExp(email) })).toHaveCount(
    0,
  );
}

/**
 * Limpieza best-effort: contexto NUEVO + login del principal, borra la fila
 * si existe y TRAGA cualquier error (nunca tapa la falla original del test).
 */
async function cleanupUser(browser: Browser, email: string) {
  let context: BrowserContext | undefined;
  try {
    context = await browser.newContext();
    const page = await context.newPage();
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.waitForURL(/\/admin$/);
    await page.goto("/admin/usuarios");
    const row = page.getByRole("row", { name: new RegExp(email) });
    if ((await row.count()) === 0) return;
    await row.getByRole("button", { name: "Eliminar" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Eliminar" })
      .click();
    await expect(row).toHaveCount(0);
  } catch (error) {
    console.warn(`No se pudo limpiar el usuario ${email}:`, error);
  } finally {
    await context?.close().catch(() => {});
  }
}

test.describe("login del panel", () => {
  test("rechaza credenciales incorrectas con un mensaje genérico", async ({
    page,
  }) => {
    await login(page, "noexiste@example.com", "clave-incorrecta-1");
    await expect(page).toHaveURL(/\/login\?error=credenciales/);
    await expect(pageAlert(page)).toHaveText(
      "Email o contraseña incorrectos.",
    );
  });

  test("/admin sin sesión redirige al login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("el admin principal entra al panel", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeVisible();
  });

  test("bloquea la cuenta tras 5 intentos fallidos", async ({
    page,
    browser,
  }) => {
    const stamp = Date.now();
    const email = `e2e-lock-${stamp}@example.com`;
    const dni = String(40_000_000 + (stamp % 10_000_000));

    try {
      await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
      await expect(page).toHaveURL(/\/admin$/);
      await createUser(page, email, dni);

      const attackerContext = await browser.newContext();
      try {
        const attacker = await attackerContext.newPage();
        for (let i = 1; i <= 5; i++) {
          await login(attacker, email, `clave-incorrecta-${i}`);
          await expect(attacker).toHaveURL(/\/login\?error=credenciales/);
        }

        // Con la cuenta bloqueada, ni la clave correcta (el DNI) entra.
        await login(attacker, email, dni);
        await expect(attacker).toHaveURL(/\/login\?error=credenciales/);
      } finally {
        await attackerContext.close();
      }
    } finally {
      await cleanupUser(browser, email);
    }
  });
});

test.describe("primer ingreso de un usuario nuevo", () => {
  test("crea usuario → entra con el DNI → cambia la clave → entra con la nueva", async ({
    page,
    browser,
  }) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@example.com`;
    const dni = String(40_000_000 + (stamp % 10_000_000));
    const newPassword = `clave-e2e-${stamp}`;

    let newUserContext: BrowserContext | undefined;
    try {
      // 1) El admin principal crea el usuario.
      await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
      await expect(page).toHaveURL(/\/admin$/);
      await createUser(page, email, dni);

      newUserContext = await browser.newContext();
      // 2) El usuario nuevo entra con el DNI y queda forzado a cambiar la clave.
      const userPage = await newUserContext.newPage();
      await login(userPage, email, dni);
      // La URL tiene que ser la de la pantalla que se ve: si quedara en
      // /admin, el formulario enviaría su Server Action a /admin y el
      // proxy la desviaría ("This page couldn't load", clave sin cambiar).
      await expect(userPage).toHaveURL(/\/admin\/cambiar-clave$/);
      await expect(
        userPage.getByRole("heading", { name: "Cambiar clave" }),
      ).toBeVisible();

      // 3) Primer envío SIN recargar ni navegar antes (como lo hace un
      // usuario real): una clave igual al DNI se rechaza con un mensaje
      // en pantalla, no con una página de error.
      await userPage.getByLabel("Clave nueva").fill(dni);
      await userPage.getByLabel("Repetí la clave").fill(dni);
      await userPage.getByRole("button", { name: "Guardar clave" }).click();
      await expect(pageAlert(userPage)).toContainText("DNI");

      // El panel no se puede usar hasta cambiarla.
      await userPage.goto("/admin/productos");
      await expect(userPage).toHaveURL(/\/admin\/cambiar-clave/);

      await userPage.getByLabel("Clave nueva").fill(newPassword);
      await userPage.getByLabel("Repetí la clave").fill(newPassword);
      await userPage.getByRole("button", { name: "Guardar clave" }).click();
      await expect(userPage).toHaveURL(/\/login\?clave=actualizada/);

      // 4) La clave vieja (DNI) ya no sirve; la nueva sí.
      await login(userPage, email, dni);
      await expect(userPage).toHaveURL(/\/login\?error=credenciales/);
      await login(userPage, email, newPassword);
      await expect(userPage).toHaveURL(/\/admin$/);

      // 5) Limpieza: el admin principal elimina al usuario y su sesión deja de valer.
      await deleteUser(page, email);

      await userPage.goto("/admin");
      await expect(userPage).toHaveURL(/\/login/);
    } finally {
      await newUserContext?.close().catch(() => {});
      await cleanupUser(browser, email);
    }
  });
});
