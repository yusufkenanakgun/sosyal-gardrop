-- DropIndex
DROP INDEX "public"."wardrobeitem_embedding_ivf";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshTokenHash" TEXT;
