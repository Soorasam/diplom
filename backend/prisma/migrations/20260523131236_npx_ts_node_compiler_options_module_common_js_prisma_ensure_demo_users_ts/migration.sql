-- AlterTable
ALTER TABLE "products" ALTER COLUMN "unit" SET DEFAULT 'шт';

-- RenameIndex
ALTER INDEX "uq_round_delivery_stop" RENAME TO "round_delivery_stops_round_id_pickup_point_id_key";

-- RenameIndex
ALTER INDEX "uq_round_participant_user_round" RENAME TO "round_participants_user_id_round_id_key";
