-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dni" TEXT,
ADD COLUMN     "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

