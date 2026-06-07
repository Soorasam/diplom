-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable (pilot defaults for new rounds)
ALTER TABLE "rounds" ALTER COLUMN "min_participants" SET DEFAULT 3;
ALTER TABLE "rounds" ALTER COLUMN "target_participants" SET DEFAULT 15;
