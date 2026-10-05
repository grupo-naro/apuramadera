import { describe, expect, it } from "vitest";

import { pickOrphanedAssetIds } from "./catalog.admin.assets";

describe("pickOrphanedAssetIds", () => {
  it("devuelve los ids candidatos que nadie más usa", () => {
    expect(pickOrphanedAssetIds(["a", "b"], [])).toEqual(["a", "b"]);
  });

  it("excluye los que otro producto sigue usando", () => {
    expect(pickOrphanedAssetIds(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
  });

  it("ignora los assets locales de public/ (empiezan con /)", () => {
    expect(pickOrphanedAssetIds(["/a1.jpeg", "products/x"], [])).toEqual([
      "products/x",
    ]);
  });

  it("ignora nulos, vacíos y espacios", () => {
    expect(pickOrphanedAssetIds([null, undefined, "", "  ", "ok"], [])).toEqual([
      "ok",
    ]);
  });

  it("no repite ids", () => {
    expect(pickOrphanedAssetIds(["a", "a", "b"], [])).toEqual(["a", "b"]);
  });
});
