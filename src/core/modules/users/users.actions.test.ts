import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth, signOut } from "@/core/auth/auth";

import {
  changePasswordAction,
  createUserAction,
  deleteUserAction,
} from "./users.actions";
import {
  changeOwnPassword,
  createAdminUser,
  removeAdminUser,
} from "./users.use-cases";

vi.mock("@/core/auth/auth", () => ({ auth: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./users.use-cases", () => ({
  changeOwnPassword: vi.fn(),
  createAdminUser: vi.fn(),
  removeAdminUser: vi.fn(),
}));

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const signOutMock = vi.mocked(signOut);
const changeMock = vi.mocked(changeOwnPassword);
const createMock = vi.mocked(createAdminUser);
const removeMock = vi.mocked(removeAdminUser);

const input = { password: "clave-nueva-segura", confirm: "clave-nueva-segura" };

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: "u1", isAdmin: true } });
  changeMock.mockResolvedValue({ ok: true });
});

describe("changePasswordAction", () => {
  it("sin sesión de admin devuelve error y no cambia la clave", async () => {
    authMock.mockResolvedValue(null);
    const result = await changePasswordAction(input);
    expect(result.ok).toBe(false);
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("si signOut falla con un error común avisa que la clave ya cambió", async () => {
    signOutMock.mockRejectedValue(new Error("boom"));
    const result = await changePasswordAction(input);
    expect(result).toEqual({
      ok: false,
      error:
        "Tu clave se cambió, pero no pudimos cerrar tu sesión. Ingresá de nuevo desde /login con la clave nueva.",
    });
  });

  it("re-lanza el redirect de Next que dispara signOut", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/login?clave=actualizada;307;",
    });
    signOutMock.mockRejectedValue(redirectError);
    await expect(changePasswordAction(input)).rejects.toBe(redirectError);
    expect(signOutMock).toHaveBeenCalledWith({
      redirectTo: "/login?clave=actualizada",
    });
  });
});

const userInput = { name: "Ana", email: "ana@tienda.com", dni: "30123456" };
const adminSession = {
  user: { id: "u1", isAdmin: true, mustChangePassword: false },
};

describe("createUserAction — control de acceso", () => {
  it("rechaza sin sesión", async () => {
    authMock.mockResolvedValue(null);
    const result = await createUserAction(userInput);
    expect(result.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rechaza si la sesión todavía debe cambiar la clave", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", isAdmin: true, mustChangePassword: true },
    });
    const result = await createUserAction(userInput);
    expect(result.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("delega en el caso de uso con una sesión admin válida", async () => {
    authMock.mockResolvedValue(adminSession);
    createMock.mockResolvedValue({ ok: true, id: "n1" });
    expect(await createUserAction(userInput)).toEqual({ ok: true, id: "n1" });
  });
});

describe("deleteUserAction — control de acceso", () => {
  it("rechaza sin sesión", async () => {
    authMock.mockResolvedValue(null);
    expect((await deleteUserAction("u2")).ok).toBe(false);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("pasa el id de la sesión como usuario actuante", async () => {
    authMock.mockResolvedValue(adminSession);
    removeMock.mockResolvedValue({ ok: true });
    await deleteUserAction("u2");
    expect(removeMock).toHaveBeenCalledWith("u2", "u1");
  });
});
