import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireActiveAdmin } from "./require-active-admin";

const { authMock, isActiveAdminMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  isActiveAdminMock: vi.fn(),
}));

vi.mock("./auth", () => ({ auth: authMock }));
vi.mock("@/core/modules/users", () => ({ isActiveAdmin: isActiveAdminMock }));

const user = (over: Record<string, unknown> = {}) => ({
  id: "u1",
  isAdmin: true,
  mustChangePassword: false,
  email: "a@b.com",
  ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  isActiveAdminMock.mockResolvedValue(true);
});

describe("requireActiveAdmin", () => {
  it("sin sesión devuelve null", async () => {
    authMock.mockResolvedValue(null);
    expect(await requireActiveAdmin()).toBeNull();
  });

  it("isAdmin false devuelve null", async () => {
    authMock.mockResolvedValue({ user: user({ isAdmin: false }) });
    expect(await requireActiveAdmin()).toBeNull();
  });

  it("id vacío o ausente (JWT viejo del magic link) devuelve null", async () => {
    authMock.mockResolvedValue({ user: user({ id: "" }) });
    expect(await requireActiveAdmin()).toBeNull();
    authMock.mockResolvedValue({ user: user({ id: undefined }) });
    expect(await requireActiveAdmin()).toBeNull();
    expect(isActiveAdminMock).not.toHaveBeenCalled();
  });

  it("mustChangePassword devuelve null", async () => {
    authMock.mockResolvedValue({ user: user({ mustChangePassword: true }) });
    expect(await requireActiveAdmin()).toBeNull();
  });

  it("usuario eliminado devuelve null", async () => {
    authMock.mockResolvedValue({ user: user() });
    isActiveAdminMock.mockResolvedValue(false);
    expect(await requireActiveAdmin()).toBeNull();
    expect(isActiveAdminMock).toHaveBeenCalledWith("u1");
  });

  it("admin válido devuelve el usuario", async () => {
    const u = user();
    authMock.mockResolvedValue({ user: u });
    expect(await requireActiveAdmin()).toEqual(u);
  });
});
