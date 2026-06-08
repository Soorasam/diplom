-- AlterTable
ALTER TABLE "users" ADD COLUMN "delivery_address" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "delivery_address" TEXT;
