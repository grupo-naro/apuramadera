import { describe, expect, it } from "vitest";

import { productFormSchema } from "./catalog.admin.schemas";

/** Input mínimo válido de un producto simple. */
const baseInput = {
  name: "Vanitorio Oslo",
  slug: "vanitorio-oslo",
  description: "",
  status: "DRAFT" as const,
  metaTitle: "",
  metaDescription: "",
  categoryIds: [],
  images: [],
  hasVariants: false,
  sku: "",
  price: "89999",
  compareAtPrice: "",
  stock: "5",
  options: [],
  variants: [],
};

describe("productFormSchema — modelo 3D / AR", () => {
  it("conserva los publicId de los modelos .glb y .usdz", () => {
    const result = productFormSchema.safeParse({
      ...baseInput,
      modelGlbPublicId: "commerce-core/vanitorio-oslo.glb",
      modelUsdzPublicId: "commerce-core/vanitorio-oslo.usdz",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.modelGlbPublicId).toBe(
      "commerce-core/vanitorio-oslo.glb",
    );
    expect(result.data.modelUsdzPublicId).toBe(
      "commerce-core/vanitorio-oslo.usdz",
    );
  });

  it("acepta strings vacíos como 'sin modelo'", () => {
    const result = productFormSchema.safeParse({
      ...baseInput,
      modelGlbPublicId: "",
      modelUsdzPublicId: "",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.modelGlbPublicId).toBe("");
    expect(result.data.modelUsdzPublicId).toBe("");
  });
});
