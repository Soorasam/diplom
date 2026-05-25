-- НП и ПВЗ: одна сущность pickup_points (name = название НП/ПВЗ).

ALTER TABLE "pickup_points" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "pickup_points" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "pickup_points" ADD COLUMN IF NOT EXISTS "ulus" TEXT;

UPDATE "pickup_points" pp
SET
  "name" = COALESCE(s."name", pp."coordinator_name"),
  "district" = s."district",
  "ulus" = s."ulus"
FROM "settlements" s
WHERE pp."settlement_id" = s."id";

UPDATE "pickup_points" SET "name" = "coordinator_name" WHERE "name" IS NULL;

ALTER TABLE "pickup_points" ALTER COLUMN "name" SET NOT NULL;

-- round_waypoints
ALTER TABLE "round_waypoints" ADD COLUMN IF NOT EXISTS "pickup_point_id" UUID;

UPDATE "round_waypoints" rw
SET "pickup_point_id" = (
  SELECT pp."id" FROM "pickup_points" pp
  WHERE pp."settlement_id" = rw."settlement_id"
  ORDER BY pp."coordinator_name"
  LIMIT 1
)
WHERE rw."pickup_point_id" IS NULL;

ALTER TABLE "round_waypoints" DROP CONSTRAINT IF EXISTS "round_waypoints_round_id_settlement_id_key";
ALTER TABLE "round_waypoints" DROP CONSTRAINT IF EXISTS "round_waypoints_settlement_id_fkey";
ALTER TABLE "round_waypoints" DROP COLUMN IF EXISTS "settlement_id";
ALTER TABLE "round_waypoints" ALTER COLUMN "pickup_point_id" SET NOT NULL;
ALTER TABLE "round_waypoints" ADD CONSTRAINT "round_waypoints_pickup_point_id_fkey"
  FOREIGN KEY ("pickup_point_id") REFERENCES "pickup_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "round_waypoints" ADD CONSTRAINT "round_waypoints_round_id_pickup_point_id_key"
  UNIQUE ("round_id", "pickup_point_id");

-- route_waypoints
ALTER TABLE "route_waypoints" ADD COLUMN IF NOT EXISTS "pickup_point_id" UUID;

UPDATE "route_waypoints" rw
SET "pickup_point_id" = (
  SELECT pp."id" FROM "pickup_points" pp
  WHERE pp."settlement_id" = rw."settlement_id"
  ORDER BY pp."coordinator_name"
  LIMIT 1
)
WHERE rw."pickup_point_id" IS NULL;

ALTER TABLE "route_waypoints" DROP CONSTRAINT IF EXISTS "route_waypoints_route_id_settlement_id_key";
ALTER TABLE "route_waypoints" DROP CONSTRAINT IF EXISTS "route_waypoints_settlement_id_fkey";
ALTER TABLE "route_waypoints" DROP COLUMN IF EXISTS "settlement_id";
ALTER TABLE "route_waypoints" ALTER COLUMN "pickup_point_id" SET NOT NULL;
ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_pickup_point_id_fkey"
  FOREIGN KEY ("pickup_point_id") REFERENCES "pickup_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_route_id_pickup_point_id_key"
  UNIQUE ("route_id", "pickup_point_id");

-- users
UPDATE "users" u
SET "pickup_point_id" = COALESCE(
  u."pickup_point_id",
  (SELECT pp."id" FROM "pickup_points" pp WHERE pp."settlement_id" = u."settlement_id" LIMIT 1)
)
WHERE u."settlement_id" IS NOT NULL;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_settlement_id_fkey";
ALTER TABLE "users" DROP COLUMN IF EXISTS "settlement_id";

-- pickup_points: убрать связь с settlements
ALTER TABLE "pickup_points" DROP CONSTRAINT IF EXISTS "pickup_points_settlement_id_fkey";
ALTER TABLE "pickup_points" DROP COLUMN IF EXISTS "settlement_id";
ALTER TABLE "pickup_points" DROP COLUMN IF EXISTS "coordinator_name";

DROP TABLE IF EXISTS "settlements";
