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
