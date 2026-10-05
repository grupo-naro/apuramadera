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
