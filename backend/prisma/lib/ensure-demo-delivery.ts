import {
  DeliveryStopStatus,
  OrderStatus,
  PrismaClient,
  RoundStatus,
} from '@prisma/client';

/** Демо-рейс для ПВЗ: закрытый сбор + заказ «в пути» + точка маршрута */
export async function ensureDemoDelivery(prisma: PrismaClient) {
  const demo = await prisma.user.findUnique({ where: { email: 'demo@coop.local' } });
  const employee = await prisma.user.findUnique({
    where: { email: 'employee@coop.local' },
  });
  if (!demo?.pickupPointId || !employee?.pickupPointId) {
    console.warn('ensureDemoDelivery: нет demo/employee или ПВЗ — пропуск');
    return;
  }

  const product = await prisma.product.findFirst({ where: { isActive: true } });
  if (!product) {
    console.warn('ensureDemoDelivery: нет товаров — пропуск');
    return;
  }

  let round = await prisma.round.findFirst({
    where: { title: { contains: 'Демо-рейс' } },
  });

  if (!round) {
    const route =
      (await prisma.route.findFirst({ orderBy: { title: 'asc' } })) ??
      (await prisma.route.create({
        data: {
          title: 'Якутск → Верхневилюйский улус',
          transportType: 'winter_road',
        },
      }));

    const closesAt = new Date();
    closesAt.setDate(closesAt.getDate() + 7);

    round = await prisma.round.create({
      data: {
        routeId: route.id,
        title: 'Демо-рейс (ПВЗ)',
        status: RoundStatus.closed,
        closesAt,
        minParticipants: 5,
        targetParticipants: 20,
        participantsCount: 1,
        currentWeightKg: 1,
        targetWeightKg: 100,
      },
    });
  } else if (round.status === RoundStatus.open) {
    round = await prisma.round.update({
      where: { id: round.id },
      data: { status: RoundStatus.closed },
    });
  }

  const existing = await prisma.order.findFirst({
    where: {
      roundId: round.id,
      pickupPointId: employee.pickupPointId,
      status: { not: OrderStatus.cancelled },
    },
  });

  if (!existing) {
    await prisma.order.create({
      data: {
        publicNumber: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        userId: demo.id,
        roundId: round.id,
        pickupPointId: employee.pickupPointId,
        status: OrderStatus.in_transit,
        statusNote: 'В пути к пункту выдачи',
        totalEstimate: product.priceEstimate,
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unit: product.unit,
            priceSnapshot: product.priceEstimate,
          },
        },
      },
    });
    console.log('  Демо-заказ создан (в пути → ПВЗ сотрудника)');
  } else if (existing.status === OrderStatus.submitted || existing.status === OrderStatus.confirmed) {
    await prisma.order.update({
      where: { id: existing.id },
      data: { status: OrderStatus.in_transit, statusNote: 'В пути к пункту выдачи' },
    });
    console.log('  Демо-заказ переведён в «в пути»');
  }

  await prisma.roundDeliveryStop.upsert({
    where: {
      uq_round_delivery_stop: {
        roundId: round.id,
        pickupPointId: employee.pickupPointId,
      },
    },
    create: {
      roundId: round.id,
      pickupPointId: employee.pickupPointId,
      status: DeliveryStopStatus.in_progress,
      sortOrder: 0,
    },
    update: {
      status: DeliveryStopStatus.in_progress,
    },
  });

  console.log('  Демо-рейс готов: employee → Приём, водитель → Маршрут');
}
