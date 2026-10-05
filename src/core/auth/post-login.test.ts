import { describe, expect, it } from "vitest";

import { postLoginDestination } from "./post-login";

describe("postLoginDestination", () => {
  it("manda a cambiar la clave si el usuario todavía debe hacerlo", () => {
    expect(
      postLoginDestination({ isAdmin: true, mustChangePassword: true }),
    ).toBe("/admin/cambiar-clave");
  });

  it("manda al panel si la clave ya está cambiada", () => {
    expect(
      postLoginDestination({ isAdmin: true, mustChangePassword: false }),
    ).toBe("/admin");
  });

  it("manda al login si no hay sesión de admin", () => {
    expect(postLoginDestination(undefined)).toBe("/login");
    expect(postLoginDestination({ isAdmin: false })).toBe("/login");
  });
});
