/**
 * Полная очистка БД и минимальный набор для деплоя / ручного теста:
 * — 5 НП, 5 ПВЗ, 5 сотрудников ПВЗ, каталог, admin + demo-житель
 * — без сборов, заказов, маршрутов, шаблонов
 *
 * npm run prisma:reset:deploy
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { ensureSeedProducts, uploadSeedProductImages } from './lib/seed-catalog';
import {
  KHANDYGA_LOCATION_INDEX,
  PVZ_EMPLOYEE_ACCOUNTS,
  seedPvzEmployees,
  seedLocations,
} from './lib/seed-settlements-pvz';

const prisma = new PrismaClient();

async function wipeAllData() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "driver_application_documents",
      "driver_applications",
      "notifications",
      "order_items",
      "orders",
      "cart_items",
      "round_participants",
      "round_delivery_stops",
      "round_waypoints",
      "rounds",
      "route_waypoints",
      "routes",
      "products",
      "categories",
      "users",
      "pickup_points"
    RESTART IDENTITY CASCADE;
  `);
}

async function seedBase() {
  const { pickupPoints } = await seedLocations(prisma);

  console.log('Каталог: 4 категории × 5 товаров…');
  await ensureSeedProducts(prisma);

  console.log('Загрузка фото товаров в MinIO…');
  await uploadSeedProductImages(prisma);

  const mainPvz = pickupPoints[KHANDYGA_LOCATION_INDEX];
  const passwordAdmin = await bcrypt.hash('admin12345', 10);
  const passwordDemo = await bcrypt.hash('demo12345', 10);

  await prisma.user.create({
    data: {
      email: 'admin@coop.local',
      fullName: 'Администратор',
      hashedPassword: passwordAdmin,
      role: UserRole.admin,
        pickupPointId: mainPvz.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'demo@coop.local',
      fullName: 'Демо Пользователь',
      hashedPassword: passwordDemo,
      role: UserRole.resident,
        pickupPointId: mainPvz.id,
      isActive: true,
    },
  });

  await seedPvzEmployees(prisma, pickupPoints);

  return { pickupPoints };
}

async function main() {
  console.log('Очистка всех таблиц (сборы, заказы, маршруты, шаблоны)…');
  await wipeAllData();

  console.log('Базовые данные для деплоя…');
  const { pickupPoints } = await seedBase();

  console.log('\nГотово. В БД только:');
  console.log(`  НП/ПВЗ: ${pickupPoints.length} · сотрудников: ${PVZ_EMPLOYEE_ACCOUNTS.length}`);
  console.log('  Каталог товаров с фото (если MinIO доступен)');
  console.log('\n  admin@coop.local / admin12345');
  console.log('  demo@coop.local  / demo12345  → ПВЗ Хандыга');
  console.log('\n  Сотрудники ПВЗ (все пароль employee12345):');
  for (const e of PVZ_EMPLOYEE_ACCOUNTS) {
    console.log(`    ${e.email}  →  ${e.fullName}`);
  }
  console.log('\nСборы и маршруты создаются только через приложение (водитель / админ).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
