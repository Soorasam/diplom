-- Вес товаров и прогресс сбора в килограммах
ALTER TABLE "products" ADD COLUMN "weight_kg" DECIMAL(8,3) NOT NULL DEFAULT 1;

ALTER TABLE "rounds" ADD COLUMN "current_weight_kg" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "rounds" ADD COLUMN "target_weight_kg" DECIMAL(10,2) NOT NULL DEFAULT 500;

-- Перенос демо-прогресса: ~28/50 участников → ~280/500 кг
UPDATE "rounds"
SET
  "current_weight_kg" = ("participants_count"::decimal * 10),
  "target_weight_kg" = GREATEST("target_participants"::decimal * 10, 100)
WHERE "current_weight_kg" = 0;
