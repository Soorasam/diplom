/**
 * Загружает картинки в MinIO и прописывает imageUrl у товаров (если БД уже была засеяна).
 * npm run storage:seed
 */
import { PrismaClient } from '@prisma/client';

import {
  SEED_PRODUCT_IMAGES,
  uploadFromAsset,
} from '../prisma/lib/minio-seed';

const prisma = new PrismaClient();

const PRODUCT_NAMES = [
  'Гречка, 1 кг',
  'Сгущённое молоко, 380 г',
  'Стиральный порошок, 3 кг',
  'Парацетамол 500 мг',
  'Герметик морозостойкий',
] as const;

async function main() {
  const products = await prisma.product.findMany({
    where: { name: { in: [...PRODUCT_NAMES] } },
    orderBy: { name: 'asc' },
  });

  if (products.length === 0) {
    console.log('Товары не найдены — сначала выполните prisma db seed');
    return;
  }

  const byName = new Map(products.map((p) => [p.name, p]));
  const order = [...PRODUCT_NAMES];

  for (let i = 0; i < order.length; i++) {
    const name = order[i];
    const product = byName.get(name);
    const img = SEED_PRODUCT_IMAGES[i];
    if (!product || !img) continue;

    const imageUrl = await uploadFromAsset(img.assetFile, img.objectKey);
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl },
    });
    console.log(`  ${name} → ${imageUrl}`);
  }

  console.log('Картинки товаров обновлены.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
