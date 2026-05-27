import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    email: 'admin@coop.local',
    password: 'admin12345',
    fullName: 'Администратор',
    role: UserRole.admin,
  },
  {
    email: 'demo@coop.local',
    password: 'demo12345',
    fullName: 'Демо Пользователь',
    role: UserRole.resident,
  },
  {
    email: 'employee@coop.local',
    password: 'employee12345',
    fullName: 'Сотрудник ПВЗ',
    phone: '+7 914 555-00-01',
    role: UserRole.employee,
  },
] as const;

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

async function seedBaseAccounts() {
  const pickupPoint = await prisma.pickupPoint.create({
    data: {
      name: 'с. Хандыга',
      district: 'Томпонский',
      ulus: 'Томпонский',
      address: 'ул. Ленина, 1',
      phone: '+7 914 000-00-01',
    },
  });

  for (const demo of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(demo.password, 10);
    await prisma.user.create({
      data: {
        email: demo.email,
        fullName: demo.fullName,
        phone: 'phone' in demo ? demo.phone : null,
        hashedPassword,
        role: demo.role,
        pickupPointId: pickupPoint.id,
        isActive: true,
      },
    });
  }

  return { pickupPoint };
}

async function main() {
  console.log('Очистка всех таблиц…');
  await wipeAllData();

  console.log('Создание базовых аккаунтов…');
  const { pickupPoint } = await seedBaseAccounts();

  console.log('\nГотово. В БД только:');
  console.log(`  ПВЗ: ${pickupPoint.name}, ${pickupPoint.address}`);
  console.log('\n  admin@coop.local      / admin12345');
  console.log('  demo@coop.local       / demo12345');
  console.log('  employee@coop.local / employee12345');
  console.log('\nКаталог и сборы отсутствуют. Каталог: npm run prisma:seed:catalog');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
