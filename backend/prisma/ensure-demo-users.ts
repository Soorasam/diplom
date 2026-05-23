import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { ensureDemoDelivery } from './lib/ensure-demo-delivery';

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

async function main() {
  const settlement = await prisma.settlement.findFirst({ orderBy: { name: 'asc' } });
  if (!settlement) {
    console.error('Нет населённых пунктов. Сначала выполните: npm run prisma:seed');
    process.exit(1);
  }

  const pickupPoint = await prisma.pickupPoint.findFirst({
    where: { settlementId: settlement.id },
    orderBy: { coordinatorName: 'asc' },
  });
  if (!pickupPoint) {
    console.error('Нет пунктов выдачи. Сначала выполните: npm run prisma:seed');
    process.exit(1);
  }

  for (const demo of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(demo.password, 10);
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        email: demo.email,
        fullName: demo.fullName,
        phone: 'phone' in demo ? demo.phone : null,
        hashedPassword,
        role: demo.role,
        settlementId: settlement.id,
        pickupPointId: pickupPoint.id,
        isActive: true,
      },
      update: {
        fullName: demo.fullName,
        hashedPassword,
        role: demo.role,
        settlementId: settlement.id,
        pickupPointId: pickupPoint.id,
        isActive: true,
        ...('phone' in demo ? { phone: demo.phone } : {}),
      },
    });
    console.log(`  ${demo.role.padEnd(12)} ${user.email} / ${demo.password}`);
  }

  console.log('\nПВЗ:', pickupPoint.coordinatorName, '—', pickupPoint.address);
  await ensureDemoDelivery(prisma);
  console.log('Вход: /auth → employee@coop.local');
  console.log('Интерфейс: /employee → Приём');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
