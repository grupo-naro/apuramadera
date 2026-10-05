import { describe, expect, it } from "vitest";

import { selectFeatured } from "./featured-selection";

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("selectFeatured", () => {
  it("sin productos devuelve una lista vacía", () => {
    expect(selectFeatured([], 0)).toEqual([]);
  });

  it("con un solo producto lo devuelve solo", () => {
    expect(selectFeatured([1], 1)).toEqual([1]);
  });

  it("de 2 a 8 productos muestra todos", () => {
    expect(selectFeatured(range(2), 2)).toEqual([1, 2]);
    expect(selectFeatured(range(8), 8)).toEqual(range(8));
  });

  it("con más de 8 productos en el catálogo muestra sólo los 4 primeros", () => {
    // `items` trae como mucho 8 (pageSize), pero `total` es el del catálogo.
    expect(selectFeatured(range(8), 9)).toEqual([1, 2, 3, 4]);
    expect(selectFeatured(range(8), 120)).toEqual([1, 2, 3, 4]);
  });
});
