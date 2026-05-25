ALTER TABLE "routes" ADD COLUMN "is_template" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "routes" ADD COLUMN "created_by_user_id" UUID;

ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "route_waypoints" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "settlement_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_procurement_point" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "route_waypoints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "route_waypoints_route_id_settlement_id_key" ON "route_waypoints"("route_id", "settlement_id");

ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "route_waypoints" ADD CONSTRAINT "route_waypoints_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
