import { describe, expect, it } from "vitest";

import { storeConfig } from "@/store.config";

import { findShippingMethod, getShippingMethods } from "./shipping";

describe("métodos de envío (sólo retiro en sucursal)", () => {
  it("ofrece un único método: el retiro en sucursal, sin costo", () => {
    const methods = getShippingMethods();
    expect(methods).toHaveLength(1);
    expect(methods[0]).toMatchObject({
      id: "pickup",
      label: "Retiro en sucursal",
      cost: 0,
      kind: "pickup",
    });
  });

  it("la descripción muestra la dirección del showroom de store.config", () => {
    const [pickup] = getShippingMethods();
    expect(storeConfig.contact.address).toBeTruthy();
    expect(pickup.description).toContain(storeConfig.contact.address);
  });

  it("no hay envíos a domicilio por zona", () => {
    expect(getShippingMethods().some((m) => m.kind === "delivery")).toBe(false);
  });

  it("el servidor rechaza un método de envío a domicilio (página vieja abierta)", () => {
    expect(findShippingMethod("delivery-z1")).toBeNull();
    expect(findShippingMethod("delivery-caba-merlo")).toBeNull();
    expect(findShippingMethod("pickup")).not.toBeNull();
  });
});
