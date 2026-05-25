import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { ensureSeedProducts, uploadSeedProductImages } from './lib/seed-catalog';
import {
  KHANDYGA_PVZ_INDEX,
  PVZ_EMPLOYEE_ACCOUNTS,
  seedPvzEmployees,
  seedLocations,
} from './lib/seed-settlements-pvz';

const prisma = new PrismaClient();

async function main() {
  const settlementCount = await prisma.settlement.count();
  const productCount = await prisma.product.count();

  if (settlementCount > 0 && productCount === 0) {
    console.log('БД с НП/пользователями без каталога — создаём товары…');
    await ensureSeedProducts(prisma);
    await uploadSeedProductImages(prisma);
    return;
  }

  if (settlementCount > 0) {
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

  const mainPvz = pickupPoints[KHANDYGA_PVZ_INDEX];
  const passwordAdmin = await bcrypt.hash('admin12345', 10);
  const passwordDemo = await bcrypt.hash('demo12345', 10);

  await prisma.user.create({
    data: {
      email: 'admin@coop.local',
      fullName: 'Администратор',
      hashedPassword: passwordAdmin,
      role: UserRole.admin,
      pickupPointId: mainPvz.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'demo@coop.local',
      fullName: 'Демо Пользователь',
      hashedPassword: passwordDemo,
      role: UserRole.resident,
      pickupPointId: mainPvz.id,
    },
  });

  await seedPvzEmployees(prisma, pickupPoints);

  console.log('Seed выполнен успешно.');
  console.log('  admin@coop.local / admin12345');
  console.log('  demo@coop.local  / demo12345 (ПВЗ Хандыга)');
  console.log('  Сотрудники ПВЗ (пароль employee12345):');
  for (const e of PVZ_EMPLOYEE_ACCOUNTS) {
    console.log(`    ${e.email}`);
  }
  console.log('  Полная очистка: npm run prisma:reset:deploy');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
