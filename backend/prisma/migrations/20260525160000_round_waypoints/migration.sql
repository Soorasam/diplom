-- Маршрут внутри сбора: поля на rounds + round_waypoints

ALTER TABLE "rounds" ADD COLUMN "transport_type" "TransportType" NOT NULL DEFAULT 'highway';
ALTER TABLE "rounds" ADD COLUMN "route_title" TEXT;
ALTER TABLE "rounds" ADD COLUMN "created_by_user_id" UUID;

UPDATE "rounds" r
SET
  "transport_type" = rt."transport_type",
  "route_title" = rt."title",
  "created_by_user_id" = rt."created_by_user_id"
FROM "routes" rt
WHERE r."route_id" = rt."id";

CREATE TABLE "round_waypoints" (
  "id" UUID NOT NULL,
  "round_id" UUID NOT NULL,
  "settlement_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "is_procurement_point" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "round_waypoints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "round_waypoints_round_id_settlement_id_key"
  ON "round_waypoints"("round_id", "settlement_id");

ALTER TABLE "round_waypoints"
  ADD CONSTRAINT "round_waypoints_round_id_fkey"
  FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "round_waypoints"
  ADD CONSTRAINT "round_waypoints_settlement_id_fkey"
  FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "round_waypoints" ("id", "round_id", "settlement_id", "sort_order", "is_procurement_point")
SELECT
  gen_random_uuid(),
  r."id",
  rw."settlement_id",
  rw."sort_order",
  rw."is_procurement_point"
FROM "route_waypoints" rw
INNER JOIN "rounds" r ON r."route_id" = rw."route_id";

ALTER TABLE "rounds" DROP CONSTRAINT IF EXISTS "rounds_route_id_fkey";
ALTER TABLE "rounds" DROP COLUMN "route_id";

ALTER TABLE "rounds"
  ADD CONSTRAINT "rounds_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DELETE FROM "routes" WHERE "is_template" = false;
