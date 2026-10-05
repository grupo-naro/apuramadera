# Login con contraseña, usuarios admin y favicon — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar el logo de Apuro Madera como favicon y reemplazar el login por magic link por email + contraseña, con usuarios admin creados desde el panel (clave inicial = DNI, cambio obligatorio en el primer ingreso).

**Architecture:** Provider Credentials de Auth.js v5 con sesión JWT (sin adapter de Prisma). Un módulo nuevo `src/core/modules/users/` con el layering estándar (schemas / types / repository / use-cases / actions) contiene hash scrypt, bloqueo por intentos, alta/baja de usuarios y cambio de clave. El proxy (edge-safe, sin DB) lee `isAdmin` y `mustChangePassword` del JWT y fuerza `/admin/cambiar-clave`.

**Tech Stack:** Next 16 (proxy), Auth.js `next-auth@5.0.0-beta.31`, Prisma 7 + `@prisma/adapter-pg`, Zod 4, `node:crypto` (scrypt), Vitest 5, Playwright, `sharp` (sólo para generar íconos).

**Spec:** `docs/superpowers/specs/2026-10-03-login-password-favicon-design.md`

> Antes de escribir código de Next/Auth.js, leé la guía relevante en `node_modules/next/dist/docs/` (este repo usa Next 16: `middleware` se llama `proxy`). Todo el código, comentarios y copy van **en español**, igual que el resto del repo.

## Global Constraints

- Gestor de paquetes: **pnpm**.
- Sesión JWT; `Session`/`Account`/`VerificationToken` quedan en el schema pero sin uso (no se eliminan tablas).
- `auth.config.ts` (lo usa el proxy) **no** importa Prisma, ni `node:crypto`, ni providers.
- Hash de contraseñas: `scrypt` de `node:crypto`, formato `salt:hash` (hex), comparación con `timingSafeEqual`. Sin dependencias nuevas de hash.
- Bloqueo: 5 fallos consecutivos → 15 minutos. Error de login siempre genérico: "Email o contraseña incorrectos."
- Nueva clave: mínimo 8 caracteres, distinta del DNI y de la actual. Al cambiarla: signOut y redirección a `/login`.
- DNI: sólo dígitos, 7 a 9, único. Clave inicial = DNI normalizado; `mustChangePassword = true`.
- Todos los usuarios con acceso al panel tienen acceso completo (sin roles). Admin = email en `ADMIN_EMAILS` **o** `User` con `passwordHash`.
- No se puede eliminar al propio usuario ni al admin principal (email en `ADMIN_EMAILS`).
- Admin principal: contraseña inicial en env `ADMIN_INITIAL_PASSWORD` (valor acordado: `Apuro Madera 123`, **sólo en `.env`, nunca en el código**).
- Un archivo = `"use server"` sólo en `*.actions.ts`. Los componentes cliente importan acciones desde el `*.actions.ts` directo (patrón del repo); el resto del código importa módulos por su `index.ts`.
- **Excepción deliberada a la regla del barrel:** `auth.ts` importa `@/core/modules/users/users.credentials` directamente, porque el barrel de `users` arrastra `users.actions.ts`, que a su vez importa `auth.ts` (evita el ciclo).
- Commits en español o inglés corto, terminados con la línea `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

Entradas y fallos que el spec implica pero no detalla; cada uno tiene su test en la tarea indicada:

1. **Sesión de un usuario ya eliminado** (JWT de 30 días sigue vivo): el panel debe dejar de abrirle. → Task 7 (`isActiveAdmin` + chequeo en `admin/layout.tsx`).
2. **Admin principal con fila `User` previa del magic link (sin `passwordHash`)**: tiene que poder entrar con `ADMIN_INITIAL_PASSWORD` y quedar con hash. → Task 4.
3. **Cuenta bloqueada + contraseña correcta**: sigue fallando hasta que pasa el bloqueo; el fallo no extiende el contador. → Task 4.
4. **DNI con puntos/espacios ("30.123.456")**: se normaliza a dígitos para la clave inicial y la unicidad. → Task 7.
5. **Llamada directa a una Server Action sin sesión, o con `mustChangePassword = true`**: debe rechazarse (las acciones no confían en el proxy). → Task 7.

Además, en Task 4: email con mayúsculas/espacios al loguear se normaliza.

---

### Task 1: Favicon con el logo

**Files:**
- Create: `scripts/generate-icons.mjs`
- Create: `src/app/icon.png`, `src/app/apple-icon.png` (generados)
- Delete: `src/app/favicon.ico`
- Modify: `package.json` (devDependency `sharp`)

**Interfaces:**
- Consumes: `public/logo.png` (1774×887, monograma "AM" negro sobre blanco).
- Produces: íconos que Next 16 detecta por convención de archivos (`icon.png`, `apple-icon.png`).

- [ ] **Step 1: Agregar sharp como devDependency**

```bash
pnpm add -D sharp
```
Expected: se agrega `sharp` a `devDependencies` (ya está en el store de pnpm como dependencia opcional de Next).

- [ ] **Step 2: Crear el script generador**

```js
// scripts/generate-icons.mjs
// Genera los íconos de la app (favicon + apple-touch) a partir del logo.
// Uso: node scripts/generate-icons.mjs
import sharp from "sharp";

const SOURCE = "public/logo.png";

/** Recorta el margen blanco del logo y lo centra en un cuadrado blanco. */
async function makeIcon(size, output, padding) {
  const inner = Math.round(size * (1 - padding * 2));
  const mark = await sharp(SOURCE)
    .trim({ threshold: 10 })
    .resize(inner, inner, { fit: "inside" })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(output);
}

await makeIcon(512, "src/app/icon.png", 0.06);
await makeIcon(180, "src/app/apple-icon.png", 0.1);
console.log("Íconos generados: src/app/icon.png, src/app/apple-icon.png");
```

- [ ] **Step 3: Ejecutarlo y revisar el resultado**

Run: `node scripts/generate-icons.mjs`
Expected: imprime "Íconos generados…". Abrir `src/app/icon.png` con la herramienta Read y confirmar que se ve el monograma "AM" centrado y legible (si queda muy chico o cortado, ajustar `padding` y volver a correr).

- [ ] **Step 4: Borrar el favicon viejo**

```bash
git rm src/app/favicon.ico
```

- [ ] **Step 5: Verificar en el navegador**

Run: `pnpm dev` (si no está corriendo) y `curl -s http://localhost:3000/ | grep -o '<link[^>]*icon[^>]*>'`
Expected: aparecen `<link rel="icon" href="/icon.png?…" type="image/png" …>` y `<link rel="apple-touch-icon" …>`. Si hay caché de favicon en el navegador, forzar recarga (Ctrl+F5).

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-icons.mjs src/app/icon.png src/app/apple-icon.png package.json pnpm-lock.yaml
git commit -m "Usar el logo de Apuro Madera como favicon" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Hash de contraseñas y lógica de bloqueo (puro)

**Files:**
- Create: `src/core/modules/users/users.password.ts`
- Create: `src/core/modules/users/users.password.test.ts`
- Create: `src/core/modules/users/users.lockout.ts`
- Create: `src/core/modules/users/users.lockout.test.ts`

**Interfaces:**
- Produces:
  - `hashPassword(password: string): Promise<string>` → `"<saltHex>:<keyHex>"`
  - `verifyPassword(password: string, stored: string): Promise<boolean>` (nunca lanza; `false` si `stored` está mal formado)
  - `MAX_FAILED_LOGINS = 5`, `LOCK_MINUTES = 15`
  - `isLocked(lockedUntil: Date | null, now?: Date): boolean`
  - `lockExpiry(now?: Date): Date`
  - `shouldLock(failedLogins: number): boolean`

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// src/core/modules/users/users.password.test.ts
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./users.password";

describe("hashPassword / verifyPassword", () => {
  it("verifica la contraseña correcta", async () => {
    const stored = await hashPassword("Apuro Madera 123");
    expect(await verifyPassword("Apuro Madera 123", stored)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const stored = await hashPassword("Apuro Madera 123");
    expect(await verifyPassword("apuro madera 123", stored)).toBe(false);
  });

  it("genera hashes distintos para la misma contraseña (salt aleatorio)", async () => {
    const a = await hashPassword("misma-clave");
    const b = await hashPassword("misma-clave");
    expect(a).not.toBe(b);
  });

  it("no guarda la contraseña en texto plano", async () => {
    const stored = await hashPassword("secreta-123");
    expect(stored).not.toContain("secreta-123");
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it("devuelve false (sin lanzar) si el hash guardado está mal formado", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "sin-separador")).toBe(false);
    expect(await verifyPassword("x", "zz:zz")).toBe(false);
  });
});
```

```ts
// src/core/modules/users/users.lockout.test.ts
import { describe, expect, it } from "vitest";

import {
  isLocked,
  LOCK_MINUTES,
  lockExpiry,
  MAX_FAILED_LOGINS,
  shouldLock,
} from "./users.lockout";

const NOW = new Date("2026-10-03T12:00:00Z");

describe("isLocked", () => {
  it("no está bloqueado sin fecha", () => {
    expect(isLocked(null, NOW)).toBe(false);
  });

  it("está bloqueado si el vencimiento es futuro", () => {
    expect(isLocked(new Date("2026-10-03T12:00:01Z"), NOW)).toBe(true);
  });

  it("deja de estar bloqueado al llegar al vencimiento", () => {
    expect(isLocked(NOW, NOW)).toBe(false);
    expect(isLocked(new Date("2026-10-03T11:59:59Z"), NOW)).toBe(false);
  });
});

describe("shouldLock", () => {
  it("bloquea recién al llegar al máximo de fallos", () => {
    expect(shouldLock(MAX_FAILED_LOGINS - 1)).toBe(false);
    expect(shouldLock(MAX_FAILED_LOGINS)).toBe(true);
  });
});

describe("lockExpiry", () => {
  it("vence LOCK_MINUTES minutos después", () => {
    expect(lockExpiry(NOW).getTime()).toBe(
      NOW.getTime() + LOCK_MINUTES * 60_000,
    );
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `pnpm test src/core/modules/users`
Expected: FAIL — "Failed to resolve import ./users.password" / "./users.lockout".

- [ ] **Step 3: Implementar**

```ts
// src/core/modules/users/users.password.ts
/**
 * Hash de contraseñas con scrypt (`node:crypto`, sin dependencias).
 *
 * Formato guardado: `<salt hex>:<key hex>`. La comparación usa
 * `timingSafeEqual` para no filtrar información por tiempos.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_BYTES = 64;

function derive(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, KEY_BYTES);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

/** `false` si la clave no coincide o si `stored` está mal formado. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await derive(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
```

```ts
// src/core/modules/users/users.lockout.ts
/**
 * Reglas de bloqueo por intentos fallidos de login (puras, sin DB).
 *
 * 5 fallos consecutivos bloquean la cuenta 15 minutos. El repositorio
 * lleva el contador (`failedLogins`) y el vencimiento (`lockedUntil`).
 */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export function isLocked(
  lockedUntil: Date | null,
  now: Date = new Date(),
): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

export function shouldLock(failedLogins: number): boolean {
  return failedLogins >= MAX_FAILED_LOGINS;
}

export function lockExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + LOCK_MINUTES * 60_000);
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `pnpm test src/core/modules/users`
Expected: PASS (2 archivos).

- [ ] **Step 5: Commit**

```bash
git add src/core/modules/users
git commit -m "Agregar hash scrypt y reglas de bloqueo para el login" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Schema de Prisma y migración

**Files:**
- Modify: `prisma/schema.prisma` (model `User`, línea ~343)
- Create: `prisma/migrations/<timestamp>_add_user_password_auth/migration.sql` (generado)

**Interfaces:**
- Produces: columnas `User.passwordHash`, `User.dni`, `User.mustChangePassword`, `User.failedLogins`, `User.lockedUntil` en el cliente generado (`@/generated/prisma/client`).

- [ ] **Step 1: Editar el modelo `User`**

Reemplazar el model `User` por:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?

  /// Hash scrypt `salt:hash`. Un User con hash tiene acceso al panel.
  passwordHash       String?
  /// DNI (sólo dígitos) de los usuarios creados desde el panel.
  dni                String?   @unique
  /// `true` hasta que el usuario cambie la clave inicial (su DNI).
  mustChangePassword Boolean   @default(false)
  /// Fallos de login consecutivos / bloqueo temporal.
  failedLogins       Int       @default(0)
  lockedUntil        DateTime?

  accounts Account[]
  sessions Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Crear y aplicar la migración**

Run: `pnpm exec prisma migrate dev --name add_user_password_auth`
Expected: crea `prisma/migrations/*_add_user_password_auth/migration.sql` con 5 `ALTER TABLE "User" ADD COLUMN …` y un `CREATE UNIQUE INDEX "User_dni_key"`, la aplica y regenera el cliente. Si pide confirmar un reset de la base, **abortar** y avisar (no debería: son columnas nuevas opcionales/con default).

- [ ] **Step 3: Verificar tipos**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add prisma
git commit -m "Agregar campos de contraseña y bloqueo al modelo User" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Repositorio de usuarios y autenticación por credenciales

**Files:**
- Create: `src/core/modules/users/users.types.ts`
- Create: `src/core/modules/users/users.repository.ts`
- Create: `src/core/modules/users/users.credentials.ts`
- Test: `src/core/modules/users/users.credentials.test.ts`

**Interfaces:**
- Consumes (Task 2): `hashPassword`, `verifyPassword`, `isLocked`, `shouldLock`, `lockExpiry`.
- Consumes (repo existente): `isAdminEmail` de `@/core/auth/admin-allowlist` (archivo hoja, sin dependencias).
- Produces (`users.types.ts`):
  ```ts
  export interface AuthUserRecord {
    id: string; email: string; name: string | null; dni: string | null;
    passwordHash: string | null; mustChangePassword: boolean;
    failedLogins: number; lockedUntil: Date | null;
  }
  export interface AdminUser {
    id: string; name: string | null; email: string; dni: string | null;
    mustChangePassword: boolean; isPrincipal: boolean; createdAt: Date;
  }
  export interface AuthenticatedUser {
    id: string; email: string; name: string | null; mustChangePassword: boolean;
  }
  ```
- Produces (`users.repository.ts`):
  - `findAuthRecordByEmail(email: string): Promise<AuthUserRecord | null>`
  - `findAuthRecordById(id: string): Promise<AuthUserRecord | null>`
  - `findAuthRecordByDni(dni: string): Promise<AuthUserRecord | null>`
  - `setInitialPassword(email: string, passwordHash: string): Promise<AuthUserRecord>` (upsert por email; `mustChangePassword=false`, limpia contadores)
  - `registerFailedLogin(id: string, now: Date): Promise<void>`
  - `resetLoginState(id: string): Promise<void>`
  - `listUsersWithPassword(): Promise<Omit<AdminUser, "isPrincipal">[]>`
  - `createUserRecord(data: { name: string; email: string; dni: string; passwordHash: string }): Promise<{ id: string }>` (upsert por email; `mustChangePassword=true`)
  - `setPassword(id: string, passwordHash: string): Promise<void>` (`mustChangePassword=false`, limpia contadores)
  - `deleteUserById(id: string): Promise<void>`
- Produces (`users.credentials.ts`): `authenticate(rawEmail: string, password: string): Promise<AuthenticatedUser | null>`

- [ ] **Step 1: Crear los tipos**

```ts
// src/core/modules/users/users.types.ts
/** Fila de `User` con lo necesario para autenticar. */
export interface AuthUserRecord {
  id: string;
  email: string;
  name: string | null;
  dni: string | null;
  passwordHash: string | null;
  mustChangePassword: boolean;
  failedLogins: number;
  lockedUntil: Date | null;
}

/** Usuario del panel tal como se lista en `/admin/usuarios`. */
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  dni: string | null;
  mustChangePassword: boolean;
  /** Email en `ADMIN_EMAILS`: no se puede eliminar. */
  isPrincipal: boolean;
  createdAt: Date;
}

/** Lo que `authorize` de Auth.js devuelve al loguearse bien. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  mustChangePassword: boolean;
}
```

- [ ] **Step 2: Crear el repositorio**

```ts
// src/core/modules/users/users.repository.ts
/**
 * Repositorio de usuarios del panel — única capa que habla con Prisma.
 */
import { prisma } from "@/core/lib/db";

import { lockExpiry, shouldLock } from "./users.lockout";
import type { AdminUser, AuthUserRecord } from "./users.types";

const authSelect = {
  id: true,
  email: true,
  name: true,
  dni: true,
  passwordHash: true,
  mustChangePassword: true,
  failedLogins: true,
  lockedUntil: true,
} as const;

// ─── Autenticación ────────────────────────────────────────────

export function findAuthRecordByEmail(
  email: string,
): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({ where: { email }, select: authSelect });
}

export function findAuthRecordById(id: string): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({ where: { id }, select: authSelect });
}

export function findAuthRecordByDni(
  dni: string,
): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({ where: { dni }, select: authSelect });
}

/**
 * Guarda la clave inicial del admin principal (crea la fila si no
 * existía — p. ej. nunca había entrado — o completa una fila previa del
 * magic link que no tenía hash).
 */
export function setInitialPassword(
  email: string,
  passwordHash: string,
): Promise<AuthUserRecord> {
  const data = {
    passwordHash,
    mustChangePassword: false,
    failedLogins: 0,
    lockedUntil: null,
  };
  return prisma.user.upsert({
    where: { email },
    create: { email, ...data },
    update: data,
    select: authSelect,
  });
}

/**
 * Suma un fallo; al llegar al máximo bloquea la cuenta y reinicia el
 * contador. El incremento es atómico (no pierde fallos concurrentes).
 */
export async function registerFailedLogin(
  id: string,
  now: Date,
): Promise<void> {
  const { failedLogins } = await prisma.user.update({
    where: { id },
    data: { failedLogins: { increment: 1 } },
    select: { failedLogins: true },
  });
  if (shouldLock(failedLogins)) {
    await prisma.user.update({
      where: { id },
      data: { failedLogins: 0, lockedUntil: lockExpiry(now) },
    });
  }
}

export async function resetLoginState(id: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { failedLogins: 0, lockedUntil: null },
  });
}

// ─── Gestión ──────────────────────────────────────────────────

export async function listUsersWithPassword(): Promise<
  Omit<AdminUser, "isPrincipal">[]
> {
  return prisma.user.findMany({
    where: { passwordHash: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });
}

/** Alta con clave inicial = DNI. Upsert: reutiliza una fila vieja sin hash. */
export async function createUserRecord(data: {
  name: string;
  email: string;
  dni: string;
  passwordHash: string;
}): Promise<{ id: string }> {
  const fields = {
    name: data.name,
    dni: data.dni,
    passwordHash: data.passwordHash,
    mustChangePassword: true,
    failedLogins: 0,
    lockedUntil: null,
  };
  return prisma.user.upsert({
    where: { email: data.email },
    create: { email: data.email, ...fields },
    update: fields,
    select: { id: true },
  });
}

export async function setPassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: false,
      failedLogins: 0,
      lockedUntil: null,
    },
  });
}

export async function deleteUserById(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}
```

- [ ] **Step 3: Escribir los tests de `authenticate` (fallan)**

```ts
// src/core/modules/users/users.credentials.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hashPassword, verifyPassword } from "./users.password";
import * as repo from "./users.repository";
import type { AuthUserRecord } from "./users.types";
import { authenticate } from "./users.credentials";

vi.mock("./users.repository", () => ({
  findAuthRecordByEmail: vi.fn(),
  setInitialPassword: vi.fn(),
  registerFailedLogin: vi.fn(),
  resetLoginState: vi.fn(),
}));

// Sólo este email es "admin principal" en los tests.
vi.mock("@/core/auth/admin-allowlist", () => ({
  isAdminEmail: (email: string) => email === "owner@tienda.com",
}));

const find = vi.mocked(repo.findAuthRecordByEmail);
const setInitial = vi.mocked(repo.setInitialPassword);
const registerFailed = vi.mocked(repo.registerFailedLogin);
const resetState = vi.mocked(repo.resetLoginState);

async function record(
  overrides: Partial<AuthUserRecord> = {},
  password = "clave-correcta-1",
): Promise<AuthUserRecord> {
  return {
    id: "u1",
    email: "ana@tienda.com",
    name: "Ana",
    dni: "30123456",
    passwordHash: await hashPassword(password),
    mustChangePassword: false,
    failedLogins: 0,
    lockedUntil: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_INITIAL_PASSWORD = "Apuro Madera 123";
});

afterEach(() => {
  delete process.env.ADMIN_INITIAL_PASSWORD;
});

describe("authenticate — usuarios con contraseña", () => {
  it("devuelve el usuario con la contraseña correcta", async () => {
    find.mockResolvedValue(await record({ mustChangePassword: true }));
    const user = await authenticate("ana@tienda.com", "clave-correcta-1");
    expect(user).toEqual({
      id: "u1",
      email: "ana@tienda.com",
      name: "Ana",
      mustChangePassword: true,
    });
    expect(registerFailed).not.toHaveBeenCalled();
  });

  it("normaliza el email (mayúsculas y espacios)", async () => {
    find.mockResolvedValue(await record());
    await authenticate("  ANA@Tienda.com ", "clave-correcta-1");
    expect(find).toHaveBeenCalledWith("ana@tienda.com");
  });

  it("rechaza contraseña incorrecta y registra el fallo", async () => {
    find.mockResolvedValue(await record());
    expect(await authenticate("ana@tienda.com", "otra")).toBeNull();
    expect(registerFailed).toHaveBeenCalledWith("u1", expect.any(Date));
  });

  it("reinicia el contador al entrar bien si había fallos previos", async () => {
    find.mockResolvedValue(await record({ failedLogins: 3 }));
    await authenticate("ana@tienda.com", "clave-correcta-1");
    expect(resetState).toHaveBeenCalledWith("u1");
  });

  it("no toca la base al entrar bien sin fallos previos", async () => {
    find.mockResolvedValue(await record());
    await authenticate("ana@tienda.com", "clave-correcta-1");
    expect(resetState).not.toHaveBeenCalled();
  });

  it("cuenta bloqueada: rechaza aun con la contraseña correcta y no suma fallos", async () => {
    find.mockResolvedValue(
      await record({ lockedUntil: new Date(Date.now() + 60_000) }),
    );
    expect(await authenticate("ana@tienda.com", "clave-correcta-1")).toBeNull();
    expect(registerFailed).not.toHaveBeenCalled();
  });

  it("bloqueo vencido: permite entrar de nuevo", async () => {
    find.mockResolvedValue(
      await record({ failedLogins: 0, lockedUntil: new Date(Date.now() - 1000) }),
    );
    expect(await authenticate("ana@tienda.com", "clave-correcta-1")).not.toBeNull();
    expect(resetState).toHaveBeenCalledWith("u1");
  });

  it("email inexistente: null, sin efectos", async () => {
    find.mockResolvedValue(null);
    expect(await authenticate("nadie@tienda.com", "x")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
    expect(registerFailed).not.toHaveBeenCalled();
  });

  it("usuario sin hash que no es admin principal: null", async () => {
    find.mockResolvedValue(await record({ passwordHash: null }));
    expect(await authenticate("ana@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("rechaza email o contraseña vacíos", async () => {
    expect(await authenticate("", "x")).toBeNull();
    expect(await authenticate("ana@tienda.com", "")).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });
});

describe("authenticate — admin principal (ADMIN_INITIAL_PASSWORD)", () => {
  it("primer ingreso sin fila: crea el hash con la clave inicial", async () => {
    find.mockResolvedValue(null);
    setInitial.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", name: null }),
    );
    const user = await authenticate("owner@tienda.com", "Apuro Madera 123");
    expect(user).toEqual({
      id: "o1",
      email: "owner@tienda.com",
      name: null,
      mustChangePassword: false,
    });
    const [email, hash] = setInitial.mock.calls[0];
    expect(email).toBe("owner@tienda.com");
    expect(await verifyPassword("Apuro Madera 123", hash)).toBe(true);
  });

  it("fila previa del magic link (sin hash): también se completa", async () => {
    find.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", passwordHash: null }),
    );
    setInitial.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com" }),
    );
    expect(
      await authenticate("owner@tienda.com", "Apuro Madera 123"),
    ).not.toBeNull();
    expect(setInitial).toHaveBeenCalledTimes(1);
  });

  it("clave inicial incorrecta: null y no crea nada", async () => {
    find.mockResolvedValue(null);
    expect(await authenticate("owner@tienda.com", "incorrecta")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("sin ADMIN_INITIAL_PASSWORD configurada: no hay bootstrap", async () => {
    delete process.env.ADMIN_INITIAL_PASSWORD;
    find.mockResolvedValue(null);
    expect(await authenticate("owner@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("una vez con hash propio, la clave inicial del env ya no entra", async () => {
    find.mockResolvedValue(
      await record(
        { id: "o1", email: "owner@tienda.com" },
        "clave-nueva-del-dueño",
      ),
    );
    expect(await authenticate("owner@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(registerFailed).toHaveBeenCalledWith("o1", expect.any(Date));
  });
});
```

- [ ] **Step 4: Correr y verificar que fallan**

Run: `pnpm test src/core/modules/users/users.credentials.test.ts`
Expected: FAIL — "Failed to resolve import ./users.credentials".

- [ ] **Step 5: Implementar `authenticate`**

```ts
// src/core/modules/users/users.credentials.ts
/**
 * Verificación de credenciales para el login (la usa `auth.ts`).
 *
 * Archivo aparte del barrel a propósito: `auth.ts` lo importa directo
 * para no crear un ciclo con `users.actions.ts` (que importa `auth.ts`).
 *
 * Casos:
 *  - Usuario con `passwordHash`: se verifica, con bloqueo por intentos.
 *  - Admin principal (email en `ADMIN_EMAILS`) sin hash todavía: entra
 *    con `ADMIN_INITIAL_PASSWORD` y se le guarda el hash.
 *  - Cualquier otro caso: `null`. El error siempre es genérico.
 */
import { createHash, timingSafeEqual } from "node:crypto";

import { isAdminEmail } from "@/core/auth/admin-allowlist";

import { isLocked } from "./users.lockout";
import { hashPassword, verifyPassword } from "./users.password";
import {
  findAuthRecordByEmail,
  registerFailedLogin,
  resetLoginState,
  setInitialPassword,
} from "./users.repository";
import type { AuthenticatedUser, AuthUserRecord } from "./users.types";

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Compara con la env en tiempo constante (hasheando ambos lados). */
function matchesInitialPassword(input: string): boolean {
  const initial = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initial) return false;
  return timingSafeEqual(sha256(input), sha256(initial));
}

function toAuthenticated(user: AuthUserRecord): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function authenticate(
  rawEmail: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !password) return null;

  const user = await findAuthRecordByEmail(email);

  // Sin hash todavía: sólo el admin principal puede entrar (con la env).
  if (!user?.passwordHash) {
    if (!isAdminEmail(email) || !matchesInitialPassword(password)) return null;
    const created = await setInitialPassword(email, await hashPassword(password));
    return toAuthenticated(created);
  }

  const now = new Date();
  if (isLocked(user.lockedUntil, now)) return null;

  if (!(await verifyPassword(password, user.passwordHash))) {
    await registerFailedLogin(user.id, now);
    return null;
  }

  if (user.failedLogins > 0 || user.lockedUntil) {
    await resetLoginState(user.id);
  }
  return toAuthenticated(user);
}
```

- [ ] **Step 6: Correr y verificar que pasan**

Run: `pnpm test src/core/modules/users && pnpm typecheck`
Expected: PASS y sin errores de tipos.

- [ ] **Step 7: Commit**

```bash
git add src/core/modules/users
git commit -m "Agregar repositorio de usuarios y verificación de credenciales" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Reemplazar el login por email + contraseña

**Files:**
- Modify: `src/core/auth/auth.ts`
- Modify: `src/core/auth/auth.config.ts`
- Modify: `src/core/auth/auth.actions.ts`
- Modify: `src/core/auth/next-auth.d.ts`
- Modify: `src/core/auth/index.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/features/auth/submit-button.tsx`
- Delete: `src/app/login/verificar/page.tsx`
- Modify: `package.json` (quitar `@auth/prisma-adapter`)

**Interfaces:**
- Consumes (Task 4): `authenticate` desde `@/core/modules/users/users.credentials`.
- Produces:
  - `loginAction(formData: FormData): Promise<void>` en `auth.actions.ts` (redirige a `/admin` o a `/login?error=credenciales`).
  - `CHANGE_PASSWORD_PATH = "/admin/cambiar-clave"` exportado de `auth.config.ts`.
  - Sesión: `session.user.id: string`, `session.user.isAdmin: boolean`, `session.user.mustChangePassword: boolean`.
  - `signOut`, `auth` sin cambios de firma.

- [ ] **Step 1: Quitar el adapter y reescribir `auth.ts`**

```bash
pnpm remove @auth/prisma-adapter
```

```ts
// src/core/auth/auth.ts
/**
 * Instancia de Auth.js — configuración completa.
 *
 * Suma a `authConfig` el provider Credentials (email + contraseña).
 * Las sesiones son JWT: no hay adapter ni filas de `Session`.
 *
 * Server-side only — no importar desde componentes cliente ni desde
 * el proxy (usar `auth.config.ts` ahí).
 *
 * Importa `users.credentials` directo (no el barrel del módulo) para
 * evitar un ciclo: el barrel exporta acciones que importan este archivo.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticate } from "@/core/modules/users/users.credentials";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        return authenticate(email, password);
      },
    }),
  ],
});
```

- [ ] **Step 2: Reescribir `auth.config.ts`**

```ts
// src/core/auth/auth.config.ts
/**
 * Configuración base de Auth.js.
 *
 * Este archivo es seguro de importar desde el `proxy` — NO incluye
 * providers ni toca la base ni usa `node:crypto`. `auth.ts` lo completa
 * con el provider Credentials.
 *
 * La sesión es JWT: el proxy valida la cookie sin DB. El JWT lleva:
 *  - `isAdmin`: sólo se emite tras un login exitoso (`authorize`).
 *  - `mustChangePassword`: obliga a pasar por `/admin/cambiar-clave`.
 */
import type { NextAuthConfig } from "next-auth";

/** Pantalla de cambio de clave (primer ingreso o voluntario). */
export const CHANGE_PASSWORD_PATH = "/admin/cambiar-clave";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // El proxy sólo lee la sesión — no necesita providers.
  providers: [],
  callbacks: {
    /** `user` sólo viene en el login: es lo que devolvió `authorize`. */
    jwt({ token, user }) {
      if (user) {
        token.isAdmin = true;
        token.uid = user.id;
        token.mustChangePassword = user.mustChangePassword === true;
      }
      return token;
    },
    /** Expone id, flag de admin y flag de cambio de clave en la sesión. */
    session({ session, token }) {
      session.user.id = token.uid ?? "";
      session.user.isAdmin = token.isAdmin === true;
      session.user.mustChangePassword = token.mustChangePassword === true;
      return session;
    },
    /** Lo usa el proxy para proteger `/admin/*`. */
    authorized({ auth, request }) {
      if (auth?.user?.isAdmin !== true) return false;
      if (
        auth.user.mustChangePassword &&
        request.nextUrl.pathname !== CHANGE_PASSWORD_PATH
      ) {
        return Response.redirect(new URL(CHANGE_PASSWORD_PATH, request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 3: Actualizar los tipos de Auth.js**

```ts
// src/core/auth/next-auth.d.ts
/**
 * Augmentación de tipos de Auth.js.
 *
 * Suma a la sesión y al token JWT el id del usuario, el flag `isAdmin`
 * y `mustChangePassword` (ver callbacks en `auth.config.ts`).
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    mustChangePassword?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isAdmin: boolean;
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    isAdmin?: boolean;
    mustChangePassword?: boolean;
  }
}
```

- [ ] **Step 4: Reescribir las acciones de auth**

```ts
// src/core/auth/auth.actions.ts
"use server";

/**
 * Server Actions de autenticación.
 *
 * `loginAction` nunca revela si el email existe, si la clave es la
 * incorrecta o si la cuenta está bloqueada: el error es siempre el mismo.
 */
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "./auth";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (error) {
    // AuthError = credenciales inválidas. El resto (NEXT_REDIRECT) se re-lanza.
    if (error instanceof AuthError) {
      redirect("/login?error=credenciales");
    }
    throw error;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
```

```ts
// src/core/auth/index.ts
/**
 * Módulo Auth — API pública.
 *
 * Autenticación del panel admin (Auth.js v5, email + contraseña). El
 * proxy importa `auth.config` directamente, no este barrel.
 */
export { auth, signIn, signOut } from "./auth";
export { loginAction, signOutAction } from "./auth.actions";
export { isAdminEmail } from "./admin-allowlist";
```

- [ ] **Step 5: Reescribir la página de login y el botón**

```tsx
// src/app/login/page.tsx
import type { Metadata } from "next";

import { loginAction } from "@/core/auth/auth.actions";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { SubmitButton } from "@/features/auth/submit-button";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; clave?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, clave } = await searchParams;

  return (
    <main className="grid min-h-full place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          Panel de la tienda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresá con tu email y tu contraseña.
        </p>

        <form action={loginAction} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>

          {clave === "actualizada" && (
            <p
              role="status"
              className="rounded-md bg-muted px-3 py-2 text-sm text-foreground"
            >
              Clave actualizada. Ingresá con tu clave nueva.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              Email o contraseña incorrectos.
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
```

En `src/features/auth/submit-button.tsx` cambiar el comentario de cabecera a "…mientras la Server Action está en curso." (sin cambios) y el texto del botón:

```tsx
      {pending ? "Ingresando…" : "Ingresar"}
```

- [ ] **Step 6: Eliminar la pantalla vieja**

```bash
git rm src/app/login/verificar/page.tsx
```

- [ ] **Step 7: Configurar `.env` local**

Agregar a `.env` (gitignored) la línea:
```
ADMIN_INITIAL_PASSWORD="Apuro Madera 123"
```
y reiniciar `pnpm dev`. (Producción: cargar la misma variable en el hosting.)

- [ ] **Step 8: Verificar tipos, lint y tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: sin errores; si `typecheck` falla por `authorize` devolviendo `AuthenticatedUser` (campo `mustChangePassword` extra), confirmar que `next-auth.d.ts` está incluido por tsconfig (ya lo estaba).

- [ ] **Step 9: Verificación manual del login**

Con `pnpm dev`:
1. `/login` con el primer email de `ADMIN_EMAILS` + `Apuro Madera 123` → entra a `/admin`.
2. Cerrar sesión y probar contraseña incorrecta → "Email o contraseña incorrectos."
3. Con un email inexistente → el mismo mensaje.
4. `/admin` sin sesión → redirige a `/login`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Reemplazar magic link por login con email y contraseña" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Cambio de clave (obligatorio en el primer ingreso y voluntario)

**Files:**
- Create: `src/core/modules/users/users.schemas.ts`
- Create: `src/core/modules/users/users.use-cases.ts`
- Test: `src/core/modules/users/users.use-cases.test.ts`
- Create: `src/core/modules/users/users.actions.ts`
- Create: `src/core/modules/users/index.ts`
- Create: `src/app/admin/cambiar-clave/page.tsx`
- Create: `src/features/auth/change-password-form.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes (Task 2/4): `hashPassword`, `verifyPassword`, `findAuthRecordById`, `setPassword`; (Task 5) `auth`, `signOut` de `@/core/auth/auth`.
- Produces:
  - `changePasswordSchema` / `type ChangePasswordInput = { password: string; confirm: string }`
  - `changeOwnPassword(userId: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>`
  - `changePasswordAction(input: ChangePasswordInput): Promise<{ ok: false; error: string }>` — en éxito hace `signOut` y redirige a `/login?clave=actualizada` (no retorna).

- [ ] **Step 1: Schema**

```ts
// src/core/modules/users/users.schemas.ts
/**
 * Schemas Zod del módulo users.
 */
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Máximo 128 caracteres"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Las claves no coinciden",
    path: ["confirm"],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
```

- [ ] **Step 2: Tests de `changeOwnPassword` (fallan)**

```ts
// src/core/modules/users/users.use-cases.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashPassword, verifyPassword } from "./users.password";
import * as repo from "./users.repository";
import type { AuthUserRecord } from "./users.types";
import { changeOwnPassword } from "./users.use-cases";

vi.mock("./users.repository", () => ({
  findAuthRecordById: vi.fn(),
  setPassword: vi.fn(),
}));

vi.mock("@/core/auth/admin-allowlist", () => ({
  isAdminEmail: (email: string) => email === "owner@tienda.com",
}));

const findById = vi.mocked(repo.findAuthRecordById);
const setPassword = vi.mocked(repo.setPassword);

async function record(
  overrides: Partial<AuthUserRecord> = {},
): Promise<AuthUserRecord> {
  return {
    id: "u1",
    email: "ana@tienda.com",
    name: "Ana",
    dni: "30123456",
    passwordHash: await hashPassword("30123456"),
    mustChangePassword: true,
    failedLogins: 0,
    lockedUntil: null,
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("changeOwnPassword", () => {
  it("guarda el hash de la clave nueva", async () => {
    findById.mockResolvedValue(await record());
    const result = await changeOwnPassword("u1", "clave-nueva-segura");
    expect(result).toEqual({ ok: true });
    const [id, hash] = setPassword.mock.calls[0];
    expect(id).toBe("u1");
    expect(await verifyPassword("clave-nueva-segura", hash)).toBe(true);
  });

  it("rechaza que la clave nueva sea el DNI", async () => {
    findById.mockResolvedValue(await record({ passwordHash: await hashPassword("otra") }));
    const result = await changeOwnPassword("u1", "30123456");
    expect(result.ok).toBe(false);
    expect(setPassword).not.toHaveBeenCalled();
  });

  it("rechaza que la clave nueva sea igual a la actual", async () => {
    findById.mockResolvedValue(
      await record({ passwordHash: await hashPassword("clave-actual-1") }),
    );
    const result = await changeOwnPassword("u1", "clave-actual-1");
    expect(result.ok).toBe(false);
    expect(setPassword).not.toHaveBeenCalled();
  });

  it("falla si el usuario ya no existe", async () => {
    findById.mockResolvedValue(null);
    const result = await changeOwnPassword("fantasma", "clave-nueva-segura");
    expect(result.ok).toBe(false);
    expect(setPassword).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `pnpm test src/core/modules/users/users.use-cases.test.ts`
Expected: FAIL — "Failed to resolve import ./users.use-cases".

- [ ] **Step 4: Implementar el caso de uso**

```ts
// src/core/modules/users/users.use-cases.ts
/**
 * Casos de uso del módulo users.
 */
import { hashPassword, verifyPassword } from "./users.password";
import { findAuthRecordById, setPassword } from "./users.repository";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Cambia la clave del propio usuario. La identidad la da la sesión (la
 * action pasa el id); acá se validan las reglas de negocio.
 */
export async function changeOwnPassword(
  userId: string,
  password: string,
): Promise<ChangePasswordResult> {
  const user = await findAuthRecordById(userId);
  if (!user) return { ok: false, error: "No encontramos tu usuario." };

  if (user.dni && password.trim() === user.dni) {
    return { ok: false, error: "La clave no puede ser tu DNI." };
  }
  if (user.passwordHash && (await verifyPassword(password, user.passwordHash))) {
    return {
      ok: false,
      error: "La clave nueva tiene que ser distinta de la actual.",
    };
  }

  await setPassword(user.id, await hashPassword(password));
  return { ok: true };
}
```

- [ ] **Step 5: Correr y verificar que pasan**

Run: `pnpm test src/core/modules/users`
Expected: PASS.

- [ ] **Step 6: Server Action y barrel**

```ts
// src/core/modules/users/users.actions.ts
"use server";

/**
 * Server actions del módulo users.
 *
 * Todas revalidan la sesión: no confían en el proxy (una Server Action
 * se puede invocar directo por POST).
 */
import { auth, signOut } from "@/core/auth/auth";

import { changePasswordSchema, type ChangePasswordInput } from "./users.schemas";
import { changeOwnPassword } from "./users.use-cases";

/**
 * Cambia la clave del usuario logueado y cierra la sesión: tiene que
 * volver a entrar con la clave nueva. En éxito redirige (no retorna).
 */
export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<{ ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.id) {
    return { ok: false, error: "Tu sesión venció. Volvé a ingresar." };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const result = await changeOwnPassword(session.user.id, parsed.data.password);
  if (!result.ok) return result;

  await signOut({ redirectTo: "/login?clave=actualizada" });
  return { ok: false, error: "No pudimos cerrar tu sesión." }; // inalcanzable: signOut redirige
}
```

```ts
// src/core/modules/users/index.ts
/**
 * Módulo Users — API pública.
 *
 * Usuarios del panel admin: contraseñas, alta/baja y cambio de clave.
 * La verificación de credenciales del login vive en
 * `users.credentials.ts` (la importa `core/auth/auth.ts` directo).
 */
export { changePasswordAction } from "./users.actions";
export { changePasswordSchema, type ChangePasswordInput } from "./users.schemas";
```

- [ ] **Step 7: Formulario y página**

```tsx
// src/features/auth/change-password-form.tsx
"use client";

/**
 * Formulario de cambio de clave. En éxito la action cierra la sesión y
 * redirige a `/login`, así que acá sólo se muestran los errores.
 */
import { useState, useTransition } from "react";

import { changePasswordAction } from "@/core/modules/users/users.actions";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await changePasswordAction({
        password: String(form.get("password") ?? ""),
        confirm: String(form.get("confirm") ?? ""),
      });
      // Sólo llega acá si hubo error (en éxito la action redirige).
      setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Clave nueva</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Repetí la clave</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar clave"}
      </Button>
    </form>
  );
}
```

```tsx
// src/app/admin/cambiar-clave/page.tsx
import type { Metadata } from "next";

import { auth } from "@/core/auth";
import { ChangePasswordForm } from "@/features/auth/change-password-form";

export const metadata: Metadata = {
  title: "Cambiar clave",
  robots: { index: false },
};

export default async function ChangePasswordPage() {
  const session = await auth();
  const forced = session?.user?.mustChangePassword === true;

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Cambiar clave</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {forced
          ? "Es tu primer ingreso: elegí una clave nueva para usar el panel."
          : "Elegí una clave nueva. Después tenés que volver a ingresar."}
      </p>
      <ChangePasswordForm />
    </div>
  );
}
```

- [ ] **Step 8: Layout — vista sin panel durante el cambio forzado, y link "Cambiar clave"**

En `src/app/admin/layout.tsx`, después del chequeo `isAdmin`:

```tsx
  // Primer ingreso: sólo se ve la pantalla de cambio de clave, sin el
  // menú (el proxy ya redirige cualquier otra ruta a ella).
  if (session.user.mustChangePassword) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }
```

Agregar `import Link from "next/link";` e `import { KeyRoundIcon, LogOutIcon } from "lucide-react";` (reemplaza el import de lucide existente) y, en el footer del sidebar, antes del `<form action={signOutAction}…>`:

```tsx
          <Link
            href="/admin/cambiar-clave"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "mt-2 w-full justify-start gap-3",
            })}
          >
            <KeyRoundIcon className="size-4" />
            Cambiar clave
          </Link>
```
(cambiar el import a `import { Button, buttonVariants } from "@/core/ui/button";`).

- [ ] **Step 9: Verificación**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: sin errores. Manual: entrar como admin principal → "Cambiar clave" en el sidebar abre la pantalla; clave de 7 caracteres → error "Mínimo 8 caracteres"; claves distintas → "Las claves no coinciden"; ok → vuelve a `/login` con el aviso "Clave actualizada…". **Después de probar, volver a poner la clave original** (cambiarla otra vez a `Apuro Madera 123` está bloqueado por "distinta de la actual" solo si es igual a la vigente; es válido porque la vigente ya es otra) o resetear la fila (`UPDATE "User" SET "passwordHash"=NULL WHERE email=…` en Prisma Studio) para que el bootstrap con la env vuelva a funcionar.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Agregar cambio de clave con cierre de sesión" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Gestión de usuarios (`/admin/usuarios`) y sesión de usuarios eliminados

**Files:**
- Modify: `src/core/modules/users/users.schemas.ts`
- Test: `src/core/modules/users/users.schemas.test.ts`
- Modify: `src/core/modules/users/users.use-cases.ts`
- Modify: `src/core/modules/users/users.use-cases.test.ts`
- Modify: `src/core/modules/users/users.actions.ts`
- Test: `src/core/modules/users/users.actions.test.ts`
- Modify: `src/core/modules/users/index.ts`
- Create: `src/app/admin/usuarios/page.tsx`
- Create: `src/features/admin/user-form.tsx`
- Create: `src/features/admin/delete-user-button.tsx`
- Modify: `src/features/admin/admin-nav.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes (Task 4): `findAuthRecordByEmail`, `findAuthRecordById`, `findAuthRecordByDni`, `createUserRecord`, `listUsersWithPassword`, `deleteUserById`; (Task 6) `changeOwnPassword` y la estructura de `users.actions.ts`.
- Produces:
  - `createUserSchema` / `type CreateUserInput = z.input<typeof createUserSchema>`; salida parseada `{ name: string; email: string (lowercase); dni: string (sólo dígitos) }`.
  - `type CreateUserResult = { ok: true; id: string } | { ok: false; error: string; field?: "name" | "email" | "dni" }`
  - `createAdminUser(input: unknown): Promise<CreateUserResult>`
  - `removeAdminUser(id: string, actingUserId: string): Promise<{ ok: true } | { ok: false; error: string }>`
  - `listAdminUsers(): Promise<AdminUser[]>`
  - `isActiveAdmin(id: string): Promise<boolean>` — `true` sólo si el `User` existe y tiene `passwordHash`.
  - `createUserAction(input: CreateUserInput): Promise<CreateUserResult>`
  - `deleteUserAction(id: string): Promise<{ ok: true } | { ok: false; error: string }>`

- [ ] **Step 1: Tests del schema (fallan)**

```ts
// src/core/modules/users/users.schemas.test.ts
import { describe, expect, it } from "vitest";

import { createUserSchema } from "./users.schemas";

const base = { name: "Ana Pérez", email: "ana@tienda.com", dni: "30123456" };

describe("createUserSchema", () => {
  it("acepta datos válidos", () => {
    expect(createUserSchema.parse(base)).toEqual(base);
  });

  it("normaliza el DNI a sólo dígitos (puntos y espacios)", () => {
    expect(createUserSchema.parse({ ...base, dni: "30.123.456" }).dni).toBe("30123456");
    expect(createUserSchema.parse({ ...base, dni: " 30 123 456 " }).dni).toBe("30123456");
  });

  it("rechaza DNI de largo inválido o con letras", () => {
    expect(createUserSchema.safeParse({ ...base, dni: "123" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, dni: "1234567890" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, dni: "abcdefgh" }).success).toBe(false);
  });

  it("normaliza el email (trim + minúsculas)", () => {
    expect(
      createUserSchema.parse({ ...base, email: "  Ana@Tienda.COM " }).email,
    ).toBe("ana@tienda.com");
  });

  it("rechaza email inválido y nombre vacío", () => {
    expect(createUserSchema.safeParse({ ...base, email: "no-es-email" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `pnpm test src/core/modules/users/users.schemas.test.ts`
Expected: FAIL — `createUserSchema` no exportado.

- [ ] **Step 3: Agregar `createUserSchema`**

Agregar al final de `users.schemas.ts`:

```ts
/** DNI argentino: se guarda sólo con dígitos (7 a 9). */
const dniSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{7,9}$/, "DNI inválido (7 a 9 dígitos)"));

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Ingresá el nombre").max(80, "Máximo 80 caracteres"),
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
  dni: dniSchema,
});

export type CreateUserInput = z.input<typeof createUserSchema>;
```

Run: `pnpm test src/core/modules/users/users.schemas.test.ts` → Expected: PASS.

- [ ] **Step 4: Tests de los casos de uso nuevos (fallan)**

Reemplazar el `vi.mock("./users.repository", …)` y el import de `users.use-cases.test.ts` por la versión ampliada, y agregar los `describe` siguientes (los tests de `changeOwnPassword` de Task 6 quedan igual):

```ts
// cabecera de users.use-cases.test.ts (reemplaza las líneas equivalentes)
import {
  changeOwnPassword,
  createAdminUser,
  isActiveAdmin,
  removeAdminUser,
} from "./users.use-cases";

vi.mock("./users.repository", () => ({
  findAuthRecordById: vi.fn(),
  findAuthRecordByEmail: vi.fn(),
  findAuthRecordByDni: vi.fn(),
  setPassword: vi.fn(),
  createUserRecord: vi.fn(),
  deleteUserById: vi.fn(),
  listUsersWithPassword: vi.fn(),
}));

const findByEmail = vi.mocked(repo.findAuthRecordByEmail);
const findByDni = vi.mocked(repo.findAuthRecordByDni);
const createRecord = vi.mocked(repo.createUserRecord);
const deleteById = vi.mocked(repo.deleteUserById);
```

```ts
describe("createAdminUser", () => {
  const input = { name: "Ana", email: "ana@tienda.com", dni: "30.123.456" };

  it("crea el usuario con el DNI como clave inicial", async () => {
    findByEmail.mockResolvedValue(null);
    findByDni.mockResolvedValue(null);
    createRecord.mockResolvedValue({ id: "new1" });

    expect(await createAdminUser(input)).toEqual({ ok: true, id: "new1" });
    const [data] = createRecord.mock.calls[0];
    expect(data).toMatchObject({ name: "Ana", email: "ana@tienda.com", dni: "30123456" });
    expect(await verifyPassword("30123456", data.passwordHash)).toBe(true);
  });

  it("rechaza el email del admin principal", async () => {
    const result = await createAdminUser({ ...input, email: "OWNER@tienda.com" });
    expect(result).toMatchObject({ ok: false, field: "email" });
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("rechaza un email que ya tiene acceso", async () => {
    findByEmail.mockResolvedValue(await record());
    const result = await createAdminUser(input);
    expect(result).toMatchObject({ ok: false, field: "email" });
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("rechaza un DNI ya usado (aun escrito con puntos)", async () => {
    findByEmail.mockResolvedValue(null);
    findByDni.mockResolvedValue(await record());
    const result = await createAdminUser(input);
    expect(result).toMatchObject({ ok: false, field: "dni" });
    expect(findByDni).toHaveBeenCalledWith("30123456");
  });

  it("devuelve el error de validación del campo", async () => {
    const result = await createAdminUser({ ...input, dni: "12" });
    expect(result).toMatchObject({ ok: false, field: "dni" });
  });
});

describe("removeAdminUser", () => {
  it("elimina a otro usuario", async () => {
    findById.mockResolvedValue(await record({ id: "u2" }));
    expect(await removeAdminUser("u2", "u1")).toEqual({ ok: true });
    expect(deleteById).toHaveBeenCalledWith("u2");
  });

  it("no permite eliminarse a uno mismo", async () => {
    const result = await removeAdminUser("u1", "u1");
    expect(result.ok).toBe(false);
    expect(deleteById).not.toHaveBeenCalled();
  });

  it("no permite eliminar al admin principal", async () => {
    findById.mockResolvedValue(await record({ id: "o1", email: "owner@tienda.com" }));
    const result = await removeAdminUser("o1", "u1");
    expect(result.ok).toBe(false);
    expect(deleteById).not.toHaveBeenCalled();
  });

  it("falla si el usuario no existe", async () => {
    findById.mockResolvedValue(null);
    expect((await removeAdminUser("nada", "u1")).ok).toBe(false);
  });
});

describe("isActiveAdmin", () => {
  it("true si el usuario existe y tiene clave", async () => {
    findById.mockResolvedValue(await record());
    expect(await isActiveAdmin("u1")).toBe(true);
  });

  it("false si el usuario fue eliminado", async () => {
    findById.mockResolvedValue(null);
    expect(await isActiveAdmin("u1")).toBe(false);
  });

  it("false si no tiene clave o el id está vacío", async () => {
    findById.mockResolvedValue(await record({ passwordHash: null }));
    expect(await isActiveAdmin("u1")).toBe(false);
    expect(await isActiveAdmin("")).toBe(false);
  });
});
```

Run: `pnpm test src/core/modules/users/users.use-cases.test.ts`
Expected: FAIL — `createAdminUser` / `removeAdminUser` / `isActiveAdmin` no exportados.

- [ ] **Step 5: Implementar los casos de uso**

Reemplazar el contenido de `users.use-cases.ts` por:

```ts
// src/core/modules/users/users.use-cases.ts
/**
 * Casos de uso del módulo users.
 */
import { isAdminEmail } from "@/core/auth/admin-allowlist";

import { hashPassword, verifyPassword } from "./users.password";
import {
  createUserRecord,
  deleteUserById,
  findAuthRecordByDni,
  findAuthRecordByEmail,
  findAuthRecordById,
  listUsersWithPassword,
  setPassword,
} from "./users.repository";
import { createUserSchema } from "./users.schemas";
import type { AdminUser } from "./users.types";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateUserResult =
  | { ok: true; id: string }
  | { ok: false; error: string; field?: "name" | "email" | "dni" };

/**
 * Cambia la clave del propio usuario. La identidad la da la sesión (la
 * action pasa el id); acá se validan las reglas de negocio.
 */
export async function changeOwnPassword(
  userId: string,
  password: string,
): Promise<ChangePasswordResult> {
  const user = await findAuthRecordById(userId);
  if (!user) return { ok: false, error: "No encontramos tu usuario." };

  if (user.dni && password.trim() === user.dni) {
    return { ok: false, error: "La clave no puede ser tu DNI." };
  }
  if (user.passwordHash && (await verifyPassword(password, user.passwordHash))) {
    return {
      ok: false,
      error: "La clave nueva tiene que ser distinta de la actual.",
    };
  }

  await setPassword(user.id, await hashPassword(password));
  return { ok: true };
}

/** Alta de un usuario del panel: su clave inicial es el DNI. */
export async function createAdminUser(input: unknown): Promise<CreateUserResult> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return {
      ok: false,
      error: issue?.message ?? "Datos inválidos.",
      field:
        field === "name" || field === "email" || field === "dni"
          ? field
          : undefined,
    };
  }
  const { name, email, dni } = parsed.data;

  if (isAdminEmail(email)) {
    return {
      ok: false,
      error: "Ese email es del admin principal.",
      field: "email",
    };
  }
  const existing = await findAuthRecordByEmail(email);
  if (existing?.passwordHash) {
    return { ok: false, error: "Ya existe un usuario con ese email.", field: "email" };
  }
  if (await findAuthRecordByDni(dni)) {
    return { ok: false, error: "Ya existe un usuario con ese DNI.", field: "dni" };
  }

  const { id } = await createUserRecord({
    name,
    email,
    dni,
    passwordHash: await hashPassword(dni),
  });
  return { ok: true, id };
}

/** Baja de un usuario. No se puede eliminar a uno mismo ni al principal. */
export async function removeAdminUser(
  id: string,
  actingUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (id === actingUserId) {
    return { ok: false, error: "No podés eliminar tu propio usuario." };
  }
  const user = await findAuthRecordById(id);
  if (!user) return { ok: false, error: "El usuario no existe." };
  if (isAdminEmail(user.email)) {
    return { ok: false, error: "No se puede eliminar al admin principal." };
  }
  await deleteUserById(id);
  return { ok: true };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const rows = await listUsersWithPassword();
  return rows.map((row) => ({ ...row, isPrincipal: isAdminEmail(row.email) }));
}

/**
 * ¿La sesión sigue siendo válida? El JWT dura días: si el usuario fue
 * eliminado, deja de abrirle el panel. Sin id (sesión vieja del magic
 * link) → `false`, así que se le pide ingresar de nuevo.
 */
export async function isActiveAdmin(id: string): Promise<boolean> {
  if (!id) return false;
  const user = await findAuthRecordById(id);
  return Boolean(user?.passwordHash);
}
```

Run: `pnpm test src/core/modules/users` → Expected: PASS.

- [ ] **Step 6: Tests de las actions (fallan)**

```ts
// src/core/modules/users/users.actions.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/core/auth/auth";

import { createUserAction, deleteUserAction } from "./users.actions";
import * as useCases from "./users.use-cases";

vi.mock("@/core/auth/auth", () => ({ auth: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./users.use-cases", () => ({
  changeOwnPassword: vi.fn(),
  createAdminUser: vi.fn(),
  removeAdminUser: vi.fn(),
}));

const mockedAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const input = { name: "Ana", email: "ana@tienda.com", dni: "30123456" };

beforeEach(() => vi.clearAllMocks());

describe("createUserAction — control de acceso", () => {
  it("rechaza sin sesión", async () => {
    mockedAuth.mockResolvedValue(null);
    const result = await createUserAction(input);
    expect(result.ok).toBe(false);
    expect(useCases.createAdminUser).not.toHaveBeenCalled();
  });

  it("rechaza si la sesión todavía debe cambiar la clave", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "u1", isAdmin: true, mustChangePassword: true },
    });
    const result = await createUserAction(input);
    expect(result.ok).toBe(false);
    expect(useCases.createAdminUser).not.toHaveBeenCalled();
  });

  it("delega en el caso de uso con una sesión admin válida", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "u1", isAdmin: true, mustChangePassword: false },
    });
    vi.mocked(useCases.createAdminUser).mockResolvedValue({ ok: true, id: "n1" });
    expect(await createUserAction(input)).toEqual({ ok: true, id: "n1" });
  });
});

describe("deleteUserAction — control de acceso", () => {
  it("rechaza sin sesión", async () => {
    mockedAuth.mockResolvedValue(null);
    expect((await deleteUserAction("u2")).ok).toBe(false);
    expect(useCases.removeAdminUser).not.toHaveBeenCalled();
  });

  it("pasa el id de la sesión como usuario actuante", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "u1", isAdmin: true, mustChangePassword: false },
    });
    vi.mocked(useCases.removeAdminUser).mockResolvedValue({ ok: true });
    await deleteUserAction("u2");
    expect(useCases.removeAdminUser).toHaveBeenCalledWith("u2", "u1");
  });
});
```

Run: `pnpm test src/core/modules/users/users.actions.test.ts`
Expected: FAIL — `createUserAction` / `deleteUserAction` no exportados.

- [ ] **Step 7: Agregar las actions**

En `users.actions.ts`: agregar `import { revalidatePath } from "next/cache";`, ampliar los imports de schemas/use-cases y agregar:

```ts
import { createAdminUser, changeOwnPassword, removeAdminUser, type CreateUserResult } from "./users.use-cases";
import { changePasswordSchema, type ChangePasswordInput, type CreateUserInput } from "./users.schemas";

/** Sesión admin válida y sin cambio de clave pendiente, o `null`. */
async function requireAdminSession() {
  const session = await auth();
  const user = session?.user;
  if (!user?.isAdmin || !user.id || user.mustChangePassword) return null;
  return user;
}

const DENIED = { ok: false, error: "No tenés permiso para hacer esto." } as const;

export async function createUserAction(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  if (!(await requireAdminSession())) return DENIED;
  const result = await createAdminUser(input);
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}

export async function deleteUserAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireAdminSession();
  if (!actor) return DENIED;
  const result = await removeAdminUser(id, actor.id);
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}
```
(fusionar con los imports existentes de Task 6 — no duplicar líneas de import).

Run: `pnpm test src/core/modules/users` → Expected: PASS.

- [ ] **Step 8: Barrel**

```ts
// src/core/modules/users/index.ts
/**
 * Módulo Users — API pública.
 *
 * Usuarios del panel admin: contraseñas, alta/baja y cambio de clave.
 * La verificación de credenciales del login vive en
 * `users.credentials.ts` (la importa `core/auth/auth.ts` directo).
 */
export {
  changePasswordAction,
  createUserAction,
  deleteUserAction,
} from "./users.actions";
export {
  changePasswordSchema,
  createUserSchema,
  type ChangePasswordInput,
  type CreateUserInput,
} from "./users.schemas";
export { isActiveAdmin, listAdminUsers } from "./users.use-cases";
export type { CreateUserResult } from "./users.use-cases";
export type { AdminUser } from "./users.types";
```

- [ ] **Step 9: UI — formulario, botón de baja y página**

```tsx
// src/features/admin/user-form.tsx
"use client";

/**
 * Alta de usuario del panel. La clave inicial es el DNI; el usuario
 * tiene que cambiarla en su primer ingreso.
 */
import { useState, useTransition } from "react";

import { createUserAction } from "@/core/modules/users/users.actions";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";

export function UserForm() {
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const result = await createUserAction({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        dni: String(form.get("dni") ?? ""),
      });
      if (result.ok) {
        setCreated(String(form.get("email") ?? ""));
        formEl.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-lg border p-4 sm:p-6"
    >
      <h2 className="font-semibold">Nuevo usuario</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-email">Email</Label>
          <Input id="user-email" name="email" type="email" required autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dni">DNI</Label>
          <Input
            id="dni"
            name="dni"
            inputMode="numeric"
            required
            autoComplete="off"
            placeholder="30123456"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        La clave inicial es el DNI (sólo números). Al ingresar por primera vez
        el sistema le va a pedir que elija una clave nueva.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {created && (
        <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">
          Usuario {created} creado.
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creando…" : "Crear usuario"}
      </Button>
    </form>
  );
}
```

```tsx
// src/features/admin/delete-user-button.tsx
"use client";

/**
 * Botón "Eliminar usuario" con confirmación (AlertDialog).
 */
import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";

import { deleteUserAction } from "@/core/modules/users/users.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/ui/alert-dialog";
import { Button } from "@/core/ui/button";

interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
}

export function DeleteUserButton({ userId, userEmail }: DeleteUserButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-destructive">
            <Trash2Icon className="size-4" />
            Eliminar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {userEmail}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pierde el acceso al panel de inmediato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </>
  );
}
```

```tsx
// src/app/admin/usuarios/page.tsx
import type { Metadata } from "next";

import { auth } from "@/core/auth";
import { listAdminUsers } from "@/core/modules/users";
import { Badge } from "@/core/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { DeleteUserButton } from "@/features/admin/delete-user-button";
import { UserForm } from "@/features/admin/user-form";

export const metadata: Metadata = {
  title: "Usuarios",
  robots: { index: false },
};

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([auth(), listAdminUsers()]);
  const currentUserId = session?.user?.id;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Personas con acceso al panel. Todas tienen acceso completo.
        </p>
      </div>

      <UserForm />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name ?? "—"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.dni ?? "—"}</TableCell>
              <TableCell>
                {user.isPrincipal ? (
                  <Badge>Admin principal</Badge>
                ) : user.mustChangePassword ? (
                  <Badge variant="secondary">Debe cambiar la clave</Badge>
                ) : (
                  <Badge variant="outline">Activo</Badge>
                )}
              </TableCell>
              <TableCell>
                {!user.isPrincipal && user.id !== currentUserId && (
                  <DeleteUserButton userId={user.id} userEmail={user.email} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```
(Verificar que `Badge` acepta `variant="secondary" | "outline"` mirando `src/core/ui/badge.tsx`; si no, usar las variantes que existan.)

- [ ] **Step 10: Nav y chequeo de sesión viva en el layout**

En `admin-nav.tsx`: importar `UserCogIcon` de `lucide-react` y agregar antes de "Configuración":

```ts
  { label: "Usuarios", href: "/admin/usuarios", icon: UserCogIcon, enabled: true },
```

En `admin/layout.tsx`, importar `import { isActiveAdmin } from "@/core/modules/users";` y justo después del chequeo `isAdmin` (antes del bloque `mustChangePassword`):

```tsx
  // El JWT dura días: si el usuario fue eliminado, ya no entra.
  if (!(await isActiveAdmin(session.user.id))) redirect("/login");
```

- [ ] **Step 11: Verificación**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: todo en verde. Manual (con `pnpm dev`): crear un usuario con tu DNI → aparece "Debe cambiar la clave"; abrir ventana privada, entrar con email + DNI → pantalla "Cambiar clave" sin sidebar; intentar abrir `/admin/productos` → vuelve a `/admin/cambiar-clave`; cambiar clave → login → entra al panel; eliminar el usuario desde la ventana principal y recargar `/admin` en la privada → redirige a `/login`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Agregar gestión de usuarios del panel y cierre de sesiones eliminadas" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Docs, `.env.example` y E2E

**Files:**
- Modify: `.env.example`
- Modify: `CLAUDE.md`
- Create: `e2e/admin-login.spec.ts`

**Interfaces:**
- Consumes: UI de las tareas 5–7 (labels: "Email", "Contraseña", botón "Ingresar"; "Clave nueva", "Repetí la clave", botón "Guardar clave"; "Nombre", "Email", "DNI", botón "Crear usuario"; botón "Eliminar" con diálogo `alertdialog`; sidebar "Cerrar sesión").

- [ ] **Step 1: `.env.example`**

Reemplazar el bloque de `ADMIN_EMAILS` + Resend (líneas ~35-44) por:

```bash
# Admin PRINCIPAL del panel: su email (podés poner más de uno, separados
# por coma). Clonar una tienda para un cliente = poner acá su email.
ADMIN_EMAILS="dueño@tienda.com"

# Contraseña inicial del admin principal. Se usa en su primer ingreso (se
# guarda hasheada en la base). Cambiala desde el panel después de entrar.
# Los demás usuarios se crean desde /admin/usuarios (clave inicial = DNI).
ADMIN_INITIAL_PASSWORD="cambiá-esto"

# Resend — emails transaccionales de la tienda (confirmación de orden,
# etc.). Ya NO se usa para el login. Opcional: sin esto no se envían.
# API key de https://resend.com/api-keys
AUTH_RESEND_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
# Remitente del email. En dev sirve onboarding@resend.dev; en
# producción, una dirección de un dominio verificado en Resend.
AUTH_EMAIL_FROM="onboarding@resend.dev"
```

- [ ] **Step 2: `CLAUDE.md`**

- En "The big picture", reemplazar la viñeta **Admin access** por:
  `- **Admin access** is email + password. The principal admin is the \`ADMIN_EMAILS\` allowlist (\`src/core/auth/admin-allowlist.ts\`) with its first password in \`ADMIN_INITIAL_PASSWORD\`; any other panel user is a \`User\` row with a \`passwordHash\`, created from \`/admin/usuarios\` (initial password = DNI, forced change on first login). No roles: everyone has full access.`
- En "Key mechanisms → Auth", reescribir: Auth.js v5 beta con provider **Credentials** (sin adapter, sesión JWT); `auth.config.ts` sin DB/providers para el proxy, que además fuerza `/admin/cambiar-clave` si el JWT trae `mustChangePassword`; `auth.ts` importa `modules/users/users.credentials` directo (excepción a la regla del barrel, evita un ciclo); hash scrypt y bloqueo 5 fallos/15 min en el módulo `users`.
- En "Layout → modules" agregar `users` a la lista.
- En "Environment": quitar `AUTH_RESEND_KEY` de las variables requeridas y agregar `ADMIN_INITIAL_PASSWORD`; aclarar que `AUTH_RESEND_KEY` ahora sólo habilita emails transaccionales.

- [ ] **Step 3: Spec E2E**

```ts
// e2e/admin-login.spec.ts
import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

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

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

test.describe("login del panel", () => {
  test("rechaza credenciales incorrectas con un mensaje genérico", async ({
    page,
  }) => {
    await login(page, "noexiste@example.com", "clave-incorrecta-1");
    await expect(page).toHaveURL(/\/login\?error=credenciales/);
    await expect(page.getByRole("alert")).toHaveText(
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

    // 1) El admin principal crea el usuario.
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/admin/usuarios");
    await page.getByLabel("Nombre").fill("Usuario E2E");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("DNI").fill(dni);
    await page.getByRole("button", { name: "Crear usuario" }).click();
    await expect(page.getByText(`Usuario ${email} creado.`)).toBeVisible();

    // 2) El usuario nuevo entra con el DNI y queda forzado a cambiar la clave.
    const newUserContext = await browser.newContext();
    const userPage = await newUserContext.newPage();
    await login(userPage, email, dni);
    await expect(userPage).toHaveURL(/\/admin\/cambiar-clave/);

    // El panel no se puede usar hasta cambiarla.
    await userPage.goto("/admin/productos");
    await expect(userPage).toHaveURL(/\/admin\/cambiar-clave/);

    // 3) Cambia la clave (primero, una igual al DNI se rechaza).
    await userPage.getByLabel("Clave nueva").fill(dni);
    await userPage.getByLabel("Repetí la clave").fill(dni);
    await userPage.getByRole("button", { name: "Guardar clave" }).click();
    await expect(userPage.getByRole("alert")).toContainText("DNI");

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
    await page.goto("/admin/usuarios");
    await page
      .getByRole("row", { name: new RegExp(email) })
      .getByRole("button", { name: "Eliminar" })
      .click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Eliminar" })
      .click();
    await expect(page.getByRole("row", { name: new RegExp(email) })).toHaveCount(0);

    await userPage.goto("/admin");
    await expect(userPage).toHaveURL(/\/login/);
    await newUserContext.close();
  });
});
```

- [ ] **Step 4: Correr el E2E**

Run: `pnpm exec playwright test e2e/admin-login.spec.ts`
Expected: 4 tests pasan. Si "el admin principal entra" falla por credenciales, revisar que el `.env` tenga `ADMIN_INITIAL_PASSWORD` y que la fila del principal no tenga otra clave (Prisma Studio → `passwordHash = null`).

- [ ] **Step 5: Verificación final completa**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: todo en verde. Confirmar además con `git status` que no quedan referencias a `requestMagicLink`, `login/verificar` ni `@auth/prisma-adapter` fuera de `docs/` y `.next/` (`grep -rn "requestMagicLink\|login/verificar\|prisma-adapter" src package.json`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Documentar el login con contraseña y agregar E2E" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Notas de despliegue (para quien publique)

- Cargar `ADMIN_INITIAL_PASSWORD` en el hosting **antes** de desplegar; sin ella el admin principal no puede entrar.
- Correr `pnpm db:deploy` para aplicar la migración `add_user_password_auth`.
- Las sesiones abiertas con el magic link (JWT sin `uid`) son rechazadas por las páginas del panel y por las rutas API de admin (vía `requireActiveAdmin`); rotar `AUTH_SECRET` las invalida de plano. Hay que volver a ingresar.
- Rotar `AUTH_SECRET` al desplegar: invalida todos los JWT preexistentes (sesiones del magic link y de usuarios eliminados) — cero costo de código.
- Recomendar al admin principal cambiar `Apuro Madera 123` desde "Cambiar clave" después del primer ingreso.
- El admin principal ya no es un riesgo de intentos sin contar: desde el cambio "claim-first", su fila se crea en el primer intento, por lo que los intentos de adivinar la clave inicial se cuentan y bloquean igual que los de cualquier otro usuario.
