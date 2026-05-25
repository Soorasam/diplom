
import { PrismaClient } from '@prisma/client';

import { ensureSeedProducts, uploadSeedProductImages } from './lib/seed-catalog';
import { SEED_PRODUCT_DEFS } from './lib/seed-products';

const prisma = new PrismaClient();

async function main() {
  console.log('Создание категорий и товаров (5 × 4)…');
  await ensureSeedProducts(prisma);
  console.log(`  позиций в каталоге: ${SEED_PRODUCT_DEFS.length}`);

  console.log('Загрузка фото в MinIO (если файлы есть)…');
  const { uploaded, missing } = await uploadSeedProductImages(prisma);
  console.log(`\nГотово. Загружено фото: ${uploaded}, ожидают файл: ${missing}`);
  console.log('Картинки: backend/prisma/seed-assets/products/ — см. README.md');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
