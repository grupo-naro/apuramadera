/**
 * Cifrado simétrico para secretos guardados en la base.
 *
 * AES-256-GCM (cifra + autentica). Se usa para los tokens de Mercado
 * Pago — el access token mueve dinero, así que no se guarda en claro.
 *
 * La clave viene de `ENCRYPTION_KEY` (32 bytes en base64). El
 * resultado de `encrypt` es `base64(iv | authTag | ciphertext)`.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/** Lee y valida la clave. Lanza si falta o no mide 32 bytes. */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? "";
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY inválida — tiene que ser 32 bytes en base64.",
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decrypt(payload: string): string {
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
