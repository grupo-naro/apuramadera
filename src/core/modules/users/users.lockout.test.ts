import { describe, expect, it } from "vitest";

import {
  isLocked,
  LOCK_MINUTES,
  lockExpiry,
  MAX_FAILED_LOGINS,
  shouldLock,
} from "./users.lockout";

const NOW = new Date("2026-10-03T12:00:00Z");

describe("isLocked", () => {
  it("no está bloqueado sin fecha", () => {
    expect(isLocked(null, NOW)).toBe(false);
  });

  it("está bloqueado si el vencimiento es futuro", () => {
    expect(isLocked(new Date("2026-10-03T12:00:01Z"), NOW)).toBe(true);
  });

  it("deja de estar bloqueado al llegar al vencimiento", () => {
    expect(isLocked(NOW, NOW)).toBe(false);
    expect(isLocked(new Date("2026-10-03T11:59:59Z"), NOW)).toBe(false);
  });
});

describe("shouldLock", () => {
  it("bloquea recién al llegar al máximo de fallos", () => {
    expect(shouldLock(MAX_FAILED_LOGINS - 1)).toBe(false);
    expect(shouldLock(MAX_FAILED_LOGINS)).toBe(true);
  });
});

describe("lockExpiry", () => {
  it("vence LOCK_MINUTES minutos después", () => {
    expect(lockExpiry(NOW).getTime()).toBe(
      NOW.getTime() + LOCK_MINUTES * 60_000,
    );
  });
});
