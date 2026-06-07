-- Escrow payment statuses: pending → held (reserve) → released (payout to coordinator)

CREATE TYPE "PaymentStatus_new" AS ENUM ('pending', 'held', 'released', 'refunded');

ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT;

ALTER TABLE "orders" ALTER COLUMN "payment_status" TYPE "PaymentStatus_new" USING (
  CASE "payment_status"::text
    WHEN 'paid' THEN 'held'::"PaymentStatus_new"
    ELSE "payment_status"::text::"PaymentStatus_new"
  END
);

ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending';

DROP TYPE "PaymentStatus";

ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
