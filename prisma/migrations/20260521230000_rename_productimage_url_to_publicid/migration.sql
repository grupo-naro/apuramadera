-- Renombra ProductImage.url a publicId (identificador del asset en Cloudinary).
ALTER TABLE "ProductImage" RENAME COLUMN "url" TO "publicId";
