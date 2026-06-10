import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { ensureSeedProducts, uploadSeedProductImages } from './lib/seed-catalog';
import { KHANDYGA_LOCATION_INDEX, seedLocations } from './lib/seed-settlements';

const prisma = new PrismaClient();

async function main() {
  const locationCount = await prisma.pickupPoint.count();
  const productCount = await prisma.product.count();

  if (locationCount > 0 && productCount === 0) {
    console.log('БД с НП/пользователями без каталога — создаём товары…');
    await ensureSeedProducts(prisma);
    await uploadSeedProductImages(prisma);
    return;
  }

  if (locationCount > 0) {
    console.log('БД уже содержит данные — обновление каталога и фото…');
    await ensureSeedProducts(prisma);
    await uploadSeedProductImages(prisma);
    console.log('Для полной очистки: npm run prisma:reset:deploy');
    return;
  }

  const { pickupPoints } = await seedLocations(prisma);

  console.log('Каталог: 4 категории × 5 товаров…');
  await ensureSeedProducts(prisma);

  console.log('Загрузка фото товаров в MinIO…');
  await uploadSeedProductImages(prisma);

  const mainLocation = pickupPoints[KHANDYGA_LOCATION_INDEX];
  const passwordAdmin = await bcrypt.hash('admin12345', 10);
  const passwordDemo = await bcrypt.hash('demo12345', 10);

  await prisma.user.create({
    data: {
      email: 'admin@coop.local',
      fullName: 'Администратор',
      hashedPassword: passwordAdmin,
      role: UserRole.admin,
      pickupPointId: mainLocation.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'demo@coop.local',
      fullName: 'Демо Пользователь',
      hashedPassword: passwordDemo,
      role: UserRole.resident,
      pickupPointId: mainLocation.id,
    },
  });

  console.log('Seed выполнен успешно.');
  console.log('  admin@coop.local / admin12345');
  console.log('  demo@coop.local  / demo12345 (с. Хандыга)');
  console.log('  Полная очистка: npm run prisma:reset:deploy');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
