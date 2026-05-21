import { PrismaClient, RoundStatus, TransportType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  SEED_PRODUCT_IMAGES,
  uploadFromAsset,
} from './lib/minio-seed';

const prisma = new PrismaClient();

const PRODUCT_DEFS = [
  {
    categoryIndex: 0,
    name: 'Гречка, 1 кг',
    description: 'Крупа в вакуумной упаковке',
    unit: 'шт',
    priceEstimate: 189,
    weightKg: 1,
    imageIndex: 0,
  },
  {
    categoryIndex: 0,
    name: 'Сгущённое молоко, 380 г',
    unit: 'бан',
    priceEstimate: 145,
    weightKg: 0.38,
    imageIndex: 1,
  },
  {
    categoryIndex: 1,
    name: 'Стиральный порошок, 3 кг',
    unit: 'уп',
    priceEstimate: 520,
    weightKg: 3,
    imageIndex: 2,
  },
  {
    categoryIndex: 2,
    name: 'Парацетамол 500 мг',
    description: 'Без рецепта',
    unit: 'уп',
    priceEstimate: 95,
    weightKg: 0.15,
    imageIndex: 3,
  },
  {
    categoryIndex: 3,
    name: 'Герметик морозостойкий',
    unit: 'шт',
    priceEstimate: 410,
    weightKg: 0.3,
    imageIndex: 4,
  },
] as const;

async function seedProductImages() {
  let minioOk = true;
  for (const def of PRODUCT_DEFS) {
    const img = SEED_PRODUCT_IMAGES[def.imageIndex];
    if (!img) continue;
    try {
      const imageUrl = await uploadFromAsset(img.assetFile, img.objectKey);
      await prisma.product.updateMany({
        where: { name: def.name },
        data: { imageUrl },
      });
      console.log(`  фото: ${def.name}`);
    } catch (err) {
      if (minioOk) {
        console.warn('MinIO недоступен — товары без картинок. Запустите docker.exe compose up -d');
        minioOk = false;
      }
    }
  }
}

async function main() {
  const count = await prisma.settlement.count();
  if (count > 0) {
    console.log('БД уже содержит данные — обновляем только картинки в MinIO…');
    await seedProductImages();
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

  const routes = await Promise.all([
    prisma.route.create({
      data: {
        title: 'Якутск → Верхневилюйский улус',
        description: 'Сезонная доставка по автозимнику и реке',
        transportType: TransportType.winter_road,
        seasonNote: 'Зимник — ноябрь–март',
      },
    }),
    prisma.route.create({
      data: {
        title: 'Нерюнгри → отдалённые стойбища',
        description: 'Сбор мелких партий для стойбищ',
        transportType: TransportType.highway,
        seasonNote: 'Круглый год, с удлинёнными сроками',
      },
    }),
  ]);

  const closesIn14 = new Date();
  closesIn14.setDate(closesIn14.getDate() + 14);
  const closesIn20 = new Date();
  closesIn20.setDate(closesIn20.getDate() + 20);

  await prisma.round.createMany({
    data: [
      {
        routeId: routes[0].id,
        title: 'Сбор «Якутск — Вилюй»',
        status: RoundStatus.open,
        closesAt: closesIn14,
        minParticipants: 10,
        targetParticipants: 50,
        participantsCount: 0,
        currentWeightKg: 280,
        targetWeightKg: 500,
      },
      {
        routeId: routes[1].id,
        title: 'Сбор «Нерюнгри — малые стойбища»',
        status: RoundStatus.open,
        closesAt: closesIn20,
        minParticipants: 8,
        targetParticipants: 40,
        participantsCount: 0,
        currentWeightKg: 160,
        targetWeightKg: 400,
      },
    ],
  });

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        title: 'Продукты и напитки',
        hint: 'Длительный срок хранения, бакалея',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        title: 'Бытовая химия и гигиена',
        hint: 'Средства, подгузники, расходники',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        title: 'Медикаменты и аптечка',
        hint: 'По рецепту и без — уточняется отдельно',
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        title: 'Стройматериалы и хозтовары',
        hint: 'Мелкий груз, совместная доставка',
        sortOrder: 4,
      },
    }),
  ]);

  for (const def of PRODUCT_DEFS) {
    await prisma.product.create({
      data: {
        categoryId: categories[def.categoryIndex].id,
        name: def.name,
        description: 'description' in def ? def.description : undefined,
        unit: def.unit,
        priceEstimate: def.priceEstimate,
        weightKg: def.weightKg,
      },
    });
  }

  console.log('Загрузка фото товаров в MinIO…');
  await seedProductImages();

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
        body: 'Новый сбор по маршруту Якутск — Вилюй принимает заказы.',
      },
      {
        userId: admin.id,
        title: 'Система',
        body: 'Демо-данные загружены. API готов к работе.',
      },
    ],
  });

  console.log('Seed выполнен успешно.');
  console.log('  admin@coop.local / admin12345');
  console.log('  demo@coop.local  / demo12345');
  console.log('  employee@coop.local / employee12345');
  console.log('  MinIO console: http://127.0.0.1:9001 (minioadmin / minioadmin)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
