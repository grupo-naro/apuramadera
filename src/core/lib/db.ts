/**
 * Cliente Prisma — instancia única (singleton).
 *
 * Prisma 7 exige un driver adapter. Usamos `@prisma/adapter-pg`
 * sobre `pg`. En desarrollo guardamos la instancia en `globalThis`
 * para que el hot-reload de Next no abra una conexión nueva en
 * cada recarga.
 *
 * La URL de la base se lee de `DATABASE_URL` (ver .env.example).
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
