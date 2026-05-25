-- CreateEnum
CREATE TYPE "OrderItemProcurementStatus" AS ENUM ('pending', 'purchased', 'refunded');

-- AlterTable
ALTER TABLE "round_delivery_stops"
ADD COLUMN "is_procurement_stop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "procurement_completed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "order_items"
ADD COLUMN "procurement_status" "OrderItemProcurementStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "procurement_pickup_point_id" UUID;

-- Backfill procurement stops from round waypoints
UPDATE "round_delivery_stops" AS s
SET "is_procurement_stop" = true
FROM "round_waypoints" AS w
WHERE w."round_id" = s."round_id"
  AND w."pickup_point_id" = s."pickup_point_id"
  AND w."is_procurement_point" = true;

-- Assign pending items at first procurement point per closed round
UPDATE "order_items" AS oi
SET "procurement_pickup_point_id" = sub."pickup_point_id"
FROM (
  SELECT DISTINCT ON (r."id")
    r."id" AS round_id,
    w."pickup_point_id"
  FROM "rounds" AS r
  JOIN "round_waypoints" AS w ON w."round_id" = r."id" AND w."is_procurement_point" = true
  WHERE r."status" IN ('closed', 'fulfilled')
  ORDER BY r."id", w."sort_order" ASC
) AS sub
JOIN "orders" AS o ON o."round_id" = sub."round_id"
WHERE oi."order_id" = o."id"
  AND oi."procurement_status" = 'pending'
  AND oi."procurement_pickup_point_id" IS NULL;
