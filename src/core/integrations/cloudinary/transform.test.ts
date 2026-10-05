import { describe, expect, it } from "vitest";

import { buildCloudinaryRawUrl } from "./transform";

describe("buildCloudinaryRawUrl", () => {
  it("entrega el asset desde /raw/upload sin transformaciones", () => {
    expect(buildCloudinaryRawUrl("commerce-core/vanitorio-oslo.glb")).toBe(
      "https://res.cloudinary.com/test-cloud/raw/upload/commerce-core/vanitorio-oslo.glb",
    );
  });

  it("escapa el publicId", () => {
    expect(buildCloudinaryRawUrl("commerce-core/mesa con espacios.usdz")).toBe(
      "https://res.cloudinary.com/test-cloud/raw/upload/commerce-core/mesa%20con%20espacios.usdz",
    );
  });
});
