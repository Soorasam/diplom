-- Одна корзина на пользователя: один товар — одна строка (объединяем дубликаты по разным сборам)
DELETE FROM "cart_items" a
USING "cart_items" b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.product_id = b.product_id;

ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "uq_cart_user_round_product";

CREATE UNIQUE INDEX "uq_cart_user_product" ON "cart_items"("user_id", "product_id");
