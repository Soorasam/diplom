-- CreateEnum
CREATE TYPE "DeliveryStopStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "round_delivery_stops" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "pickup_point_id" UUID NOT NULL,
    "status" "DeliveryStopStatus" NOT NULL DEFAULT 'pending',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "round_delivery_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_round_delivery_stop" ON "round_delivery_stops"("round_id", "pickup_point_id");

-- AddForeignKey
ALTER TABLE "round_delivery_stops" ADD CONSTRAINT "round_delivery_stops_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_delivery_stops" ADD CONSTRAINT "round_delivery_stops_pickup_point_id_fkey" FOREIGN KEY ("pickup_point_id") REFERENCES "pickup_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
