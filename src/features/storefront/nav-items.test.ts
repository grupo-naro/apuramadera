import { describe, expect, it } from "vitest";

import { buildNavItems } from "./nav-items";

const cat = (n: number) => ({ name: `Categoría ${n}`, slug: `categoria-${n}` });

describe("buildNavItems", () => {
  it("sin categorías muestra sólo los links fijos", () => {
    expect(buildNavItems([]).map((i) => i.label)).toEqual([
      "A medida",
      "Showroom",
      "Contacto",
    ]);
  });

  it("pone las categorías primero, con su link de filtro", () => {
    const items = buildNavItems([cat(1), cat(2)]);
    expect(items.map((i) => i.label)).toEqual([
      "Categoría 1",
      "Categoría 2",
      "A medida",
      "Showroom",
      "Contacto",
    ]);
    expect(items[0].href).toBe("/productos?category=categoria-1");
  });

  it("muestra una sola categoría si hay una sola", () => {
    expect(buildNavItems([cat(1)]).map((i) => i.label)).toEqual([
      "Categoría 1",
      "A medida",
      "Showroom",
      "Contacto",
    ]);
  });

  it("con más de dos categorías muestra sólo las 2 primeras", () => {
    const labels = buildNavItems([cat(1), cat(2), cat(3), cat(4)]).map((i) => i.label);
    expect(labels).toEqual(["Categoría 1", "Categoría 2", "A medida", "Showroom", "Contacto"]);
  });

  it("A medida va a su página, Showroom a la home y Contacto al pie de la página actual", () => {
    const byLabel = Object.fromEntries(buildNavItems([]).map((i) => [i.label, i.href]));
    expect(byLabel["A medida"]).toBe("/muebles-a-medida");
    expect(byLabel["Showroom"]).toBe("/#showroom");
    expect(byLabel["Contacto"]).toBe("#contacto");
  });

  it("no incluye el link Todo", () => {
    expect(buildNavItems([cat(1)]).some((i) => i.label === "Todo")).toBe(false);
  });
});
