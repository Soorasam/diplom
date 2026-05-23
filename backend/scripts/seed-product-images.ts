/**
 * Загружает картинки в MinIO и прописывает imageUrl у товаров.
 * npm run storage:seed
 */
import { PrismaClient } from '@prisma/client';

import { uploadSeedProductImages } from '../prisma/lib/seed-catalog';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  if (count === 0) {
    console.log('Товары не найдены — сначала: npm run prisma:seed:catalog');
    return;
  }

  const { uploaded, missing } = await uploadSeedProductImages(prisma);
  console.log(`Готово. Загружено: ${uploaded}, без файла: ${missing}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
