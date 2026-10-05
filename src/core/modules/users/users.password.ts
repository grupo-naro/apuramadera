/**
 * Hash de contraseñas con scrypt (`node:crypto`, sin dependencias).
 *
 * Formato guardado: `<salt hex>:<key hex>`. La comparación usa
 * `timingSafeEqual` para no filtrar información por tiempos.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_BYTES = 64;

function derive(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, KEY_BYTES);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

/** `false` si la clave no coincide o si `stored` está mal formado. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await derive(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
