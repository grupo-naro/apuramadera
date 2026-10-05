import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hashPassword, verifyPassword } from "./users.password";
import * as repo from "./users.repository";
import type { AuthUserRecord } from "./users.types";
import { authenticate } from "./users.credentials";

vi.mock("./users.repository", () => ({
  findAuthRecordByEmail: vi.fn(),
  setInitialPassword: vi.fn(),
  claimLoginAttempt: vi.fn(),
  ensureLoginRow: vi.fn(),
  resetLoginState: vi.fn(),
}));

// Sólo este email es "admin principal" en los tests.
vi.mock("@/core/auth/admin-allowlist", () => ({
  isAdminEmail: (email: string) => email === "owner@tienda.com",
}));

const find = vi.mocked(repo.findAuthRecordByEmail);
const setInitial = vi.mocked(repo.setInitialPassword);
const claim = vi.mocked(repo.claimLoginAttempt);
const ensureRow = vi.mocked(repo.ensureLoginRow);
const resetState = vi.mocked(repo.resetLoginState);

async function record(
  overrides: Partial<AuthUserRecord> = {},
  password = "clave-correcta-1",
): Promise<AuthUserRecord> {
  return {
    id: "u1",
    email: "ana@tienda.com",
    name: "Ana",
    dni: "30123456",
    passwordHash: await hashPassword(password),
    mustChangePassword: false,
    failedLogins: 0,
    lockedUntil: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  claim.mockResolvedValue(true);
  process.env.ADMIN_INITIAL_PASSWORD = "Apuro Madera 123";
});

afterEach(() => {
  delete process.env.ADMIN_INITIAL_PASSWORD;
});

describe("authenticate — usuarios con contraseña", () => {
  it("devuelve el usuario con la contraseña correcta", async () => {
    find.mockResolvedValue(await record({ mustChangePassword: true }));
    const user = await authenticate("ana@tienda.com", "clave-correcta-1");
    expect(user).toEqual({
      id: "u1",
      email: "ana@tienda.com",
      name: "Ana",
      mustChangePassword: true,
    });
    expect(claim).toHaveBeenCalledWith("u1");
  });

  it("normaliza el email (mayúsculas y espacios)", async () => {
    find.mockResolvedValue(await record());
    await authenticate("  ANA@Tienda.com ", "clave-correcta-1");
    expect(find).toHaveBeenCalledWith("ana@tienda.com");
  });

  it("rechaza contraseña incorrecta y registra el fallo", async () => {
    find.mockResolvedValue(await record());
    expect(await authenticate("ana@tienda.com", "otra")).toBeNull();
    expect(claim).toHaveBeenCalledWith("u1");
    expect(resetState).not.toHaveBeenCalled();
  });

  it("reinicia el contador al entrar bien si había fallos previos", async () => {
    find.mockResolvedValue(await record({ failedLogins: 3 }));
    await authenticate("ana@tienda.com", "clave-correcta-1");
    expect(resetState).toHaveBeenCalledWith("u1");
  });

  it("al entrar bien sin fallos previos reinicia igual (la reserva ya sumó 1)", async () => {
    find.mockResolvedValue(await record());
    await authenticate("ana@tienda.com", "clave-correcta-1");
    expect(resetState).toHaveBeenCalledWith("u1");
  });

  it("cuenta bloqueada: rechaza aun con la contraseña correcta y no suma fallos", async () => {
    find.mockResolvedValue(
      await record({ lockedUntil: new Date(Date.now() + 60_000) }),
    );
    expect(await authenticate("ana@tienda.com", "clave-correcta-1")).toBeNull();
    expect(claim).not.toHaveBeenCalled();
  });

  it("bloqueo vencido: permite entrar de nuevo", async () => {
    find.mockResolvedValue(
      await record({ failedLogins: 0, lockedUntil: new Date(Date.now() - 1000) }),
    );
    expect(await authenticate("ana@tienda.com", "clave-correcta-1")).not.toBeNull();
    expect(resetState).toHaveBeenCalledWith("u1");
  });

  it("email inexistente: null, sin efectos", async () => {
    find.mockResolvedValue(null);
    expect(await authenticate("nadie@tienda.com", "x")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
    expect(ensureRow).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });

  it("usuario sin hash que no es admin principal: null", async () => {
    find.mockResolvedValue(await record({ passwordHash: null }));
    expect(await authenticate("ana@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("rechaza email o contraseña vacíos", async () => {
    expect(await authenticate("", "x")).toBeNull();
    expect(await authenticate("ana@tienda.com", "")).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });
});

describe("authenticate — admin principal (ADMIN_INITIAL_PASSWORD)", () => {
  it("primer ingreso sin fila: crea el hash con la clave inicial", async () => {
    find.mockResolvedValue(null);
    ensureRow.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", passwordHash: null }),
    );
    setInitial.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", name: null }),
    );
    const user = await authenticate("owner@tienda.com", "Apuro Madera 123");
    expect(user).toEqual({
      id: "o1",
      email: "owner@tienda.com",
      name: null,
      mustChangePassword: false,
    });
    const [email, hash] = setInitial.mock.calls[0];
    expect(email).toBe("owner@tienda.com");
    expect(await verifyPassword("Apuro Madera 123", hash)).toBe(true);
  });

  it("fila previa del magic link (sin hash): también se completa", async () => {
    find.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", passwordHash: null }),
    );
    setInitial.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com" }),
    );
    expect(
      await authenticate("owner@tienda.com", "Apuro Madera 123"),
    ).not.toBeNull();
    expect(setInitial).toHaveBeenCalledTimes(1);
  });

  it("clave inicial incorrecta: null y no guarda ningún hash", async () => {
    find.mockResolvedValue(null);
    ensureRow.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", passwordHash: null }),
    );
    expect(await authenticate("owner@tienda.com", "incorrecta")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("sin ADMIN_INITIAL_PASSWORD configurada: no hay bootstrap", async () => {
    delete process.env.ADMIN_INITIAL_PASSWORD;
    find.mockResolvedValue(null);
    expect(await authenticate("owner@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("una vez con hash propio, la clave inicial del env ya no entra", async () => {
    find.mockResolvedValue(
      await record(
        { id: "o1", email: "owner@tienda.com" },
        "clave-nueva-del-dueño",
      ),
    );
    expect(await authenticate("owner@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(claim).toHaveBeenCalledWith("o1");
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("sin fila y clave inicial incorrecta: crea la fila, cuenta el intento y rechaza", async () => {
    find.mockResolvedValue(null);
    ensureRow.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", passwordHash: null }),
    );
    expect(await authenticate("owner@tienda.com", "incorrecta")).toBeNull();
    expect(ensureRow).toHaveBeenCalledWith("owner@tienda.com");
    expect(claim).toHaveBeenCalledWith("o1");
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("email desconocido que no es principal: no crea fila ni reserva intento", async () => {
    find.mockResolvedValue(null);
    expect(await authenticate("nadie@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(ensureRow).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });

  it("principal sin ADMIN_INITIAL_PASSWORD: null y no crea fila", async () => {
    delete process.env.ADMIN_INITIAL_PASSWORD;
    find.mockResolvedValue(null);
    expect(await authenticate("owner@tienda.com", "x")).toBeNull();
    expect(ensureRow).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });
});

// Nota: la cota de intentos en paralelo (a lo sumo 5 verificaciones antes
// del bloqueo) es una propiedad de la sentencia atómica de
// `claimLoginAttempt` en la base; no se simula acá con mocks.
describe("authenticate — reserva de intento rechazada (cuenta bloqueada en la base)", () => {
  it("no verifica la clave, ni correcta ni incorrecta", async () => {
    claim.mockResolvedValue(false);
    find.mockResolvedValue(await record());
    expect(await authenticate("ana@tienda.com", "clave-correcta-1")).toBeNull();
    expect(await authenticate("ana@tienda.com", "mala")).toBeNull();
    expect(resetState).not.toHaveBeenCalled();
    expect(setInitial).not.toHaveBeenCalled();
  });

  it("principal sin hash: la clave inicial correcta tampoco entra", async () => {
    claim.mockResolvedValue(false);
    find.mockResolvedValue(
      await record({ id: "o1", email: "owner@tienda.com", passwordHash: null }),
    );
    expect(await authenticate("owner@tienda.com", "Apuro Madera 123")).toBeNull();
    expect(setInitial).not.toHaveBeenCalled();
  });
});
