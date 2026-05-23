import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MOCK_TITLES = [
  'Якутск → Верхневилюйский улус',
  'Нерюнгри → отдалённые стойбища',
];

async function main() {
  const routes = await prisma.route.findMany({
    where: { title: { in: [...MOCK_TITLES] } },
    select: { id: true, title: true },
  });

  if (routes.length === 0) {
    console.log('Мок-маршруты уже отсутствуют.');
    return;
  }

  const routeIds = routes.map((r) => r.id);

  const rounds = await prisma.round.findMany({
    where: { routeId: { in: routeIds } },
    select: { id: true, title: true },
  });

  const roundIds = rounds.map((r) => r.id);

  if (roundIds.length > 0) {
    const orders = await prisma.order.findMany({
      where: { roundId: { in: roundIds } },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      const deletedOrders = await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });
      console.log(`Удалено заказов: ${deletedOrders.count}`);
    }

    await prisma.cartItem.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.roundParticipant.deleteMany({ where: { roundId: { in: roundIds } } });
    await prisma.roundDeliveryStop.deleteMany({ where: { roundId: { in: roundIds } } });
    const deletedRounds = await prisma.round.deleteMany({
      where: { id: { in: roundIds } },
    });
    console.log(`Удалено сборов (Round): ${deletedRounds.count}`);
  }

  const deleted = await prisma.route.deleteMany({
    where: { id: { in: routeIds } },
  });
  console.log(`Удалено маршрутов: ${deleted.count}`);
  routes.forEach((r) => console.log(`  - ${r.title}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
