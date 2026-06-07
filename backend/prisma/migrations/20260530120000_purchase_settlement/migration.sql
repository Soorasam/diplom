-- Round purchase settlement + receipt photos

ALTER TABLE "rounds" ADD COLUMN "actual_purchase_total" DECIMAL(12,2);
ALTER TABLE "rounds" ADD COLUMN "purchase_settled_at" TIMESTAMP(3);

ALTER TABLE "orders" ADD COLUMN "refund_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE "round_procurement_receipts" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "object_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "round_procurement_receipts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "round_procurement_receipts" ADD CONSTRAINT "round_procurement_receipts_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "round_procurement_receipts_round_id_idx" ON "round_procurement_receipts"("round_id");
