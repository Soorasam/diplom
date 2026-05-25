import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PVZ_EMPLOYEE_ACCOUNTS } from './lib/seed-settlements-pvz';

const prisma = new PrismaClient();

const CORE_USERS = [
  {
    email: 'admin@coop.local',
    password: 'admin12345',
    fullName: 'Администратор',
    role: UserRole.admin,
    locationName: 'с. Хандыга',
  },
  {
    email: 'demo@coop.local',
    password: 'demo12345',
    fullName: 'Демо Пользователь',
    role: UserRole.resident,
    locationName: 'с. Хандыга',
  },
] as const;

const PVZ_BY_EMPLOYEE_EMAIL = [
  { email: PVZ_EMPLOYEE_ACCOUNTS[0].email, locationName: 'с. Хандыга' },
  { email: PVZ_EMPLOYEE_ACCOUNTS[1].email, locationName: 'с. Батагай' },
  { email: PVZ_EMPLOYEE_ACCOUNTS[2].email, locationName: 'с. Вилюйск' },
  { email: PVZ_EMPLOYEE_ACCOUNTS[3].email, locationName: 'с. Оймякон' },
  { email: PVZ_EMPLOYEE_ACCOUNTS[4].email, locationName: 'Якутск' },
] as const;

async function main() {
  const pickupByName = new Map(
    (await prisma.pickupPoint.findMany()).map((p) => [p.name, p]),
  );

  if (pickupByName.size === 0) {
    console.error('Нет ПВЗ. Сначала: npm run prisma:reset:deploy');
    process.exit(1);
  }

  for (const demo of CORE_USERS) {
    const pickupPoint = pickupByName.get(demo.locationName);
    if (!pickupPoint) {
      console.error(`ПВЗ не найден: ${demo.locationName}`);
      process.exit(1);
    }
    const hashedPassword = await bcrypt.hash(demo.password, 10);
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        email: demo.email,
        fullName: demo.fullName,
        hashedPassword,
        role: demo.role,
        pickupPointId: pickupPoint.id,
        isActive: true,
      },
      update: {
        fullName: demo.fullName,
        hashedPassword,
        role: demo.role,
        pickupPointId: pickupPoint.id,
        isActive: true,
      },
    });
    console.log(`  ${demo.role.padEnd(12)} ${user.email} / ${demo.password}`);
  }

  const employeePassword = await bcrypt.hash('employee12345', 10);

  for (let i = 0; i < PVZ_EMPLOYEE_ACCOUNTS.length; i++) {
    const account = PVZ_EMPLOYEE_ACCOUNTS[i];
    const link = PVZ_BY_EMPLOYEE_EMAIL[i];
    const pickupPoint = pickupByName.get(link.locationName);
    if (!pickupPoint) {
      console.error(`ПВЗ не найден: ${link.locationName}`);
      process.exit(1);
    }

    const user = await prisma.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        fullName: account.fullName,
        phone: account.phone,
        hashedPassword: employeePassword,
        role: UserRole.employee,
        pickupPointId: pickupPoint.id,
        isActive: true,
      },
      update: {
        fullName: account.fullName,
        phone: account.phone,
        hashedPassword: employeePassword,
        role: UserRole.employee,
        pickupPointId: pickupPoint.id,
        isActive: true,
      },
    });
    console.log(
      `  ${UserRole.employee.padEnd(12)} ${user.email} / employee12345  →  ${pickupPoint.name}`,
    );
  }

  console.log('\nДемо-рейс и тестовые заказы не создаются — только сценарии в приложении.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
