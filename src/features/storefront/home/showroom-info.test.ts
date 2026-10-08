import { describe, expect, it } from "vitest";

import { formatWhatsappNumber, mapsUrl } from "./showroom-info";

describe("formatWhatsappNumber", () => {
  it("formatea un celular de Buenos Aires (549 + 11 + 8 dígitos)", () => {
    expect(formatWhatsappNumber("5491144457240")).toBe("11 4445-7240");
  });

  it("ignora espacios, guiones y el +", () => {
    expect(formatWhatsappNumber("+54 9 11 4445-7240")).toBe("11 4445-7240");
  });

  it("si no reconoce el formato, devuelve el número con + y sólo dígitos", () => {
    expect(formatWhatsappNumber("5493515551234")).toBe("+5493515551234");
    expect(formatWhatsappNumber("12345")).toBe("+12345");
  });

  it("con texto vacío devuelve vacío", () => {
    expect(formatWhatsappNumber("")).toBe("");
  });
});

describe("mapsUrl", () => {
  it("arma la búsqueda de Google Maps con la dirección codificada", () => {
    expect(mapsUrl("Av. Pte Perón 24880 (ex Rivadavia), Merlo")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20Pte%20Per%C3%B3n%2024880%20(ex%20Rivadavia)%2C%20Merlo",
    );
  });
});
