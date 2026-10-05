import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashPassword, verifyPassword } from "./users.password";
import * as repo from "./users.repository";
import type { AuthUserRecord } from "./users.types";
import {
  changeOwnPassword,
  createAdminUser,
  isActiveAdmin,
  removeAdminUser,
} from "./users.use-cases";

vi.mock("./users.repository", () => ({
  findAuthRecordById: vi.fn(),
  findAuthRecordByEmail: vi.fn(),
  findAuthRecordByDni: vi.fn(),
  setPassword: vi.fn(),
  createUserRecord: vi.fn(),
  deleteUserById: vi.fn(),
  listUsersWithPassword: vi.fn(),
}));

vi.mock("@/core/auth/admin-allowlist", () => ({
  isAdminEmail: (email: string) => email === "owner@tienda.com",
}));

const findById = vi.mocked(repo.findAuthRecordById);
const setPassword = vi.mocked(repo.setPassword);
const findByEmail = vi.mocked(repo.findAuthRecordByEmail);
const findByDni = vi.mocked(repo.findAuthRecordByDni);
const createRecord = vi.mocked(repo.createUserRecord);
const deleteById = vi.mocked(repo.deleteUserById);

async function record(
  overrides: Partial<AuthUserRecord> = {},
): Promise<AuthUserRecord> {
  return {
    id: "u1",
    email: "ana@tienda.com",
    name: "Ana",
    dni: "30123456",
    passwordHash: await hashPassword("30123456"),
    mustChangePassword: true,
    failedLogins: 0,
    lockedUntil: null,
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("changeOwnPassword", () => {
  it("guarda el hash de la clave nueva", async () => {
    findById.mockResolvedValue(await record());
    const result = await changeOwnPassword("u1", "clave-nueva-segura");
    expect(result).toEqual({ ok: true });
    const [id, hash] = setPassword.mock.calls[0];
    expect(id).toBe("u1");
    expect(await verifyPassword("clave-nueva-segura", hash)).toBe(true);
  });

  it("rechaza que la clave nueva sea el DNI", async () => {
    findById.mockResolvedValue(await record({ passwordHash: await hashPassword("otra") }));
    const result = await changeOwnPassword("u1", "30123456");
    expect(result.ok).toBe(false);
    expect(setPassword).not.toHaveBeenCalled();
  });

  it("rechaza que la clave nueva sea igual a la actual", async () => {
    findById.mockResolvedValue(
      await record({ passwordHash: await hashPassword("clave-actual-1") }),
    );
    const result = await changeOwnPassword("u1", "clave-actual-1");
    expect(result.ok).toBe(false);
    expect(setPassword).not.toHaveBeenCalled();
  });

  it("falla si el usuario ya no existe", async () => {
    findById.mockResolvedValue(null);
    const result = await changeOwnPassword("fantasma", "clave-nueva-segura");
    expect(result.ok).toBe(false);
    expect(setPassword).not.toHaveBeenCalled();
  });
});

describe("createAdminUser", () => {
  const input = { name: "Ana", email: "ana@tienda.com", dni: "30.123.456" };

  it("crea el usuario con el DNI como clave inicial", async () => {
    findByEmail.mockResolvedValue(null);
    findByDni.mockResolvedValue(null);
    createRecord.mockResolvedValue({ id: "new1" });

    expect(await createAdminUser(input)).toEqual({ ok: true, id: "new1" });
    const [data] = createRecord.mock.calls[0];
    expect(data).toMatchObject({ name: "Ana", email: "ana@tienda.com", dni: "30123456" });
    expect(await verifyPassword("30123456", data.passwordHash)).toBe(true);
  });

  it("rechaza el email del admin principal", async () => {
    const result = await createAdminUser({ ...input, email: "OWNER@tienda.com" });
    expect(result).toMatchObject({ ok: false, field: "email" });
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("rechaza un email que ya tiene acceso", async () => {
    findByEmail.mockResolvedValue(await record());
    const result = await createAdminUser(input);
    expect(result).toMatchObject({ ok: false, field: "email" });
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("rechaza un DNI ya usado (aun escrito con puntos)", async () => {
    findByEmail.mockResolvedValue(null);
    findByDni.mockResolvedValue(await record());
    const result = await createAdminUser(input);
    expect(result).toMatchObject({ ok: false, field: "dni" });
    expect(findByDni).toHaveBeenCalledWith("30123456");
  });

  describe("carrera: createUserRecord viola la unicidad", () => {
    const p2002 = (meta?: unknown) =>
      Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
        meta,
      });

    beforeEach(() => {
      findByEmail.mockResolvedValue(null);
      findByDni.mockResolvedValue(null);
    });

    it("target con dni -> error de DNI", async () => {
      createRecord.mockRejectedValue(p2002({ target: ["dni"] }));
      expect(await createAdminUser(input)).toEqual({
        ok: false,
        error: "Ya existe un usuario con ese DNI.",
        field: "dni",
      });
    });

    it("target con email -> error de email", async () => {
      createRecord.mockRejectedValue(p2002({ target: "User_email_key" }));
      expect(await createAdminUser(input)).toEqual({
        ok: false,
        error: "Ya existe un usuario con ese email.",
        field: "email",
      });
    });

    it("P2002 sin meta -> error genérico sin campo", async () => {
      createRecord.mockRejectedValue(p2002());
      expect(await createAdminUser(input)).toEqual({
        ok: false,
        error: "Ya existe un usuario con ese email o DNI.",
      });
    });

    it("otro error se relanza", async () => {
      const boom = new Error("boom");
      createRecord.mockRejectedValue(boom);
      await expect(createAdminUser(input)).rejects.toBe(boom);
    });
  });

  it("devuelve el error de validación del campo", async () => {
    const result = await createAdminUser({ ...input, dni: "12" });
    expect(result).toMatchObject({ ok: false, field: "dni" });
  });
});

describe("removeAdminUser", () => {
  it("elimina a otro usuario", async () => {
    findById.mockResolvedValue(await record({ id: "u2" }));
    expect(await removeAdminUser("u2", "u1")).toEqual({ ok: true });
    expect(deleteById).toHaveBeenCalledWith("u2");
  });

  it("no permite eliminarse a uno mismo", async () => {
    const result = await removeAdminUser("u1", "u1");
    expect(result.ok).toBe(false);
    expect(deleteById).not.toHaveBeenCalled();
  });

  it("no permite eliminar al admin principal", async () => {
    findById.mockResolvedValue(await record({ id: "o1", email: "owner@tienda.com" }));
    const result = await removeAdminUser("o1", "u1");
    expect(result.ok).toBe(false);
    expect(deleteById).not.toHaveBeenCalled();
  });

  it("falla si el usuario no existe", async () => {
    findById.mockResolvedValue(null);
    expect((await removeAdminUser("nada", "u1")).ok).toBe(false);
  });
});

describe("isActiveAdmin", () => {
  it("true si el usuario existe y tiene clave", async () => {
    findById.mockResolvedValue(await record());
    expect(await isActiveAdmin("u1")).toBe(true);
  });

  it("false si el usuario fue eliminado", async () => {
    findById.mockResolvedValue(null);
    expect(await isActiveAdmin("u1")).toBe(false);
  });

  it("false si no tiene clave o el id está vacío", async () => {
    findById.mockResolvedValue(await record({ passwordHash: null }));
    expect(await isActiveAdmin("u1")).toBe(false);
    expect(await isActiveAdmin("")).toBe(false);
  });
});
