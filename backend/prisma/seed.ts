import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { ensureDemoDelivery } from './lib/ensure-demo-delivery';
import { ensureSeedProducts, uploadSeedProductImages } from './lib/seed-catalog';

const prisma = new PrismaClient();

async function main() {
  const settlementCount = await prisma.settlement.count();
  const productCount = await prisma.product.count();

  if (settlementCount > 0 && productCount === 0) {
    console.log('БД с пользователями без каталога — создаём товары…');
    await ensureSeedProducts(prisma);
    await uploadSeedProductImages(prisma);
    await ensureDemoDelivery(prisma);
    return;
  }

  if (settlementCount > 0) {
    console.log('БД уже содержит данные — обновление каталога и фото…');
    await ensureSeedProducts(prisma);
    await uploadSeedProductImages(prisma);
    await ensureDemoDelivery(prisma);
    return;
  }

  const settlements = await Promise.all([
    prisma.settlement.create({
      data: { name: 'с. Хандыга', district: 'Томпонский', ulus: 'Томпонский' },
    }),
    prisma.settlement.create({
      data: { name: 'с. Батагай', district: 'Верхоянский', ulus: 'Верхоянский' },
    }),
    prisma.settlement.create({
      data: { name: 'с. Вилюйск', district: 'Вилюйский', ulus: 'Вилюйский' },
    }),
    prisma.settlement.create({
      data: { name: 'с. Оймякон', district: 'Оймяконский', ulus: 'Оймяконский' },
    }),
  ]);

  const pickupPoints = await Promise.all([
    prisma.pickupPoint.create({
      data: {
        settlementId: settlements[0].id,
        coordinatorName: 'Иванов А.',
        address: 'ул. Ленина, 12',
        phone: '+7 914 000-00-01',
      },
    }),
    prisma.pickupPoint.create({
      data: {
        settlementId: settlements[1].id,
        coordinatorName: 'Петров С.',
        address: 'пункт выдачи, центр',
        phone: '+7 914 000-00-02',
      },
    }),
    prisma.pickupPoint.create({
      data: {
        settlementId: settlements[3].id,
        coordinatorName: 'Слепцов Н.',
        address: 'ул. Советская, 5',
        phone: '+7 914 000-00-03',
      },
    }),
  ]);

  console.log('Каталог: 4 категории × 5 товаров…');
  await ensureSeedProducts(prisma);

  console.log('Загрузка фото товаров в MinIO…');
  await uploadSeedProductImages(prisma);

  const passwordAdmin = await bcrypt.hash('admin12345', 10);
  const passwordDemo = await bcrypt.hash('demo12345', 10);
  const passwordEmployee = await bcrypt.hash('employee12345', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@coop.local',
      fullName: 'Администратор',
      hashedPassword: passwordAdmin,
      role: UserRole.admin,
      settlementId: settlements[0].id,
      pickupPointId: pickupPoints[0].id,
    },
  });

  const demo = await prisma.user.create({
    data: {
      email: 'demo@coop.local',
      fullName: 'Демо Пользователь',
      hashedPassword: passwordDemo,
      role: UserRole.resident,
      settlementId: settlements[0].id,
      pickupPointId: pickupPoints[0].id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'employee@coop.local',
      fullName: 'Сотрудник ПВЗ',
      hashedPassword: passwordEmployee,
      role: UserRole.employee,
      settlementId: settlements[0].id,
      pickupPointId: pickupPoints[0].id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: demo.id,
        title: 'Сбор открыт',
        body: 'Каталог открыт — оформите заказ в ближайший сбор.',
      },
      {
        userId: admin.id,
        title: 'Система',
        body: 'Демо-данные загружены. API готов к работе.',
      },
    ],
  });

  await ensureDemoDelivery(prisma);

  console.log('Seed выполнен успешно.');
  console.log('  admin@coop.local / admin12345');
  console.log('  demo@coop.local  / demo12345');
  console.log('  employee@coop.local / employee12345');
  console.log('  Картинки: prisma/seed-assets/products/README.md');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
