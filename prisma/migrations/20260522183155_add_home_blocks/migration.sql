-- CreateEnum
CREATE TYPE "HomeBlockType" AS ENUM ('HERO_BANNER', 'PRODUCT_CAROUSEL', 'CATEGORY_GRID');

-- CreateTable
CREATE TABLE "HomeBlock" (
    "id" TEXT NOT NULL,
    "type" "HomeBlockType" NOT NULL,
    "data" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeBlock_sortOrder_idx" ON "HomeBlock"("sortOrder");
