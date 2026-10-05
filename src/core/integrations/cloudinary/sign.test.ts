import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { cloudinarySignature } from "./sign";

describe("cloudinarySignature", () => {
  it("firma los parámetros ordenados alfabéticamente + el api_secret (sha1)", () => {
    const expected = createHash("sha1")
      .update("folder=commerce-core&timestamp=1700000000SECRET")
      .digest("hex");

    expect(
      cloudinarySignature(
        { timestamp: 1_700_000_000, folder: "commerce-core" },
        "SECRET",
      ),
    ).toBe(expected);
  });
});
