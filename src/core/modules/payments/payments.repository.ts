/**
 * Repositorio de la conexión de pago — única capa que habla con
 * Prisma. Cifra los tokens al guardar y los descifra al leer.
 *
 * Hay UNA conexión por proveedor (la tienda es un clon, no
 * multitenant) — `provider` es `@unique`.
 */
import { prisma } from "@/core/lib/db";
import { decrypt, encrypt } from "@/core/lib/encryption";

import type { PaymentConnection } from "./payments.types";

const PROVIDER = "mercadopago";

/** Datos para persistir una conexión (tokens en claro — se cifran acá). */
export interface SaveConnectionData {
  mpUserId: string;
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  scope: string | null;
  expiresAt: Date;
}

/** Conexión actual con los tokens descifrados, o `null` si no hay. */
export async function findConnection(): Promise<PaymentConnection | null> {
  const row = await prisma.paymentConnection.findUnique({
    where: { provider: PROVIDER },
  });
  if (!row) return null;

  return {
    mpUserId: row.mpUserId,
    accessToken: decrypt(row.accessToken),
    refreshToken: decrypt(row.refreshToken),
    publicKey: row.publicKey,
    expiresAt: row.expiresAt,
    connectedAt: row.connectedAt,
  };
}

/** Crea o reemplaza la conexión (upsert por proveedor). */
export async function saveConnection(data: SaveConnectionData): Promise<void> {
  const fields = {
    mpUserId: data.mpUserId,
    accessToken: encrypt(data.accessToken),
    refreshToken: encrypt(data.refreshToken),
    publicKey: data.publicKey,
    scope: data.scope,
    expiresAt: data.expiresAt,
  };
  await prisma.paymentConnection.upsert({
    where: { provider: PROVIDER },
    create: { provider: PROVIDER, ...fields },
    update: fields,
  });
}

export async function deleteConnection(): Promise<void> {
  await prisma.paymentConnection.deleteMany({ where: { provider: PROVIDER } });
}
