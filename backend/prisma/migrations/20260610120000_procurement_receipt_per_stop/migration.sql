-- Привязка чеков закупки к конкретной точке маршрута
DELETE FROM "round_procurement_receipts";

ALTER TABLE "round_procurement_receipts" ADD COLUMN "pickup_point_id" UUID NOT NULL;

ALTER TABLE "round_procurement_receipts"
  ADD CONSTRAINT "round_procurement_receipts_pickup_point_id_fkey"
  FOREIGN KEY ("pickup_point_id") REFERENCES "pickup_points"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "round_procurement_receipts_round_id_pickup_point_id_idx"
  ON "round_procurement_receipts"("round_id", "pickup_point_id");
