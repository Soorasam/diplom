import { PrismaClient, RoundStatus, TransportType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.settlement.count();
  if (count > 0) {
    console.log('БД уже содержит данные — пропуск seed.');
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
        participantsCount: 28,
      },
      {
        routeId: routes[1].id,
        title: 'Сбор «Нерюнгри — малые стойбища»',
        status: RoundStatus.open,
        closesAt: closesIn20,
        minParticipants: 8,
        targetParticipants: 40,
        participantsCount: 16,
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

  await prisma.product.createMany({
    data: [
      {
        categoryId: categories[0].id,
        name: 'Гречка, 1 кг',
        description: 'Крупа в вакуумной упаковке',
        unit: 'шт',
        priceEstimate: 189,
      },
      {
        categoryId: categories[0].id,
        name: 'Сгущённое молоко, 380 г',
        unit: 'бан',
        priceEstimate: 145,
      },
      {
        categoryId: categories[1].id,
        name: 'Стиральный порошок, 3 кг',
        unit: 'уп',
        priceEstimate: 520,
      },
      {
        categoryId: categories[2].id,
        name: 'Парацетамол 500 мг',
        description: 'Без рецепта',
        unit: 'уп',
        priceEstimate: 95,
      },
      {
        categoryId: categories[3].id,
        name: 'Герметик морозостойкий',
        unit: 'шт',
        priceEstimate: 410,
      },
    ],
  });

  const passwordAdmin = await bcrypt.hash('admin12345', 10);
  const passwordDemo = await bcrypt.hash('demo12345', 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@coop.local',
        fullName: 'Администратор',
        hashedPassword: passwordAdmin,
        role: UserRole.admin,
        settlementId: settlements[0].id,
        pickupPointId: pickupPoints[0].id,
      },
      {
        email: 'demo@coop.local',
        fullName: 'Демо Пользователь',
        hashedPassword: passwordDemo,
        role: UserRole.resident,
        settlementId: settlements[0].id,
        pickupPointId: pickupPoints[0].id,
      },
    ],
  });

  console.log('Seed выполнен успешно.');
  console.log('  admin@coop.local / admin12345');
  console.log('  demo@coop.local  / demo12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
