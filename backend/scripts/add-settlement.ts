/**
 * Добавляет населённый пункт, если его ещё нет (без сброса БД).
 * Запуск: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/add-settlement.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SETTLEMENT = {
  name: 'с. Оймякон',
  district: 'Оймяконский',
  ulus: 'Оймяконский',
};

const PICKUP = {
  coordinatorName: 'Слепцов Н.',
  address: 'ул. Советская, 5',
  phone: '+7 914 000-00-03',
};

async function main() {
  const existing = await prisma.settlement.findFirst({
    where: { name: SETTLEMENT.name },
  });

  if (existing) {
    console.log(`Населённый пункт уже есть: ${existing.name} (${existing.id})`);
    const pp = await prisma.pickupPoint.findFirst({
      where: { settlementId: existing.id },
    });
    if (!pp) {
      const created = await prisma.pickupPoint.create({
        data: { settlementId: existing.id, ...PICKUP },
      });
      console.log(`Добавлен ПВЗ: ${created.coordinatorName}`);
    }
    return;
  }

  const settlement = await prisma.settlement.create({ data: SETTLEMENT });
  const pickup = await prisma.pickupPoint.create({
    data: { settlementId: settlement.id, ...PICKUP },
  });

  console.log(`Добавлен населённый пункт: ${settlement.name}`);
  console.log(`  id: ${settlement.id}`);
  console.log(`  ПВЗ: ${pickup.coordinatorName}, ${pickup.address}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
