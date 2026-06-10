import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Удаляет все сборы (rounds) и заказы, сохраняя пользователей, каталог, НП и заявки водителей */
async function main() {
  const [orders, rounds, carts] = await Promise.all([
    prisma.order.count(),
    prisma.round.count(),
    prisma.cartItem.count(),
  ]);

  console.log(`Сейчас в БД: ${rounds} сборов, ${orders} заказов, ${carts} позиций в корзинах`);

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.cartItem.deleteMany();
    await tx.roundProcurementReceipt.deleteMany();
    await tx.roundParticipant.deleteMany();
    await tx.roundDeliveryStop.deleteMany();
    await tx.roundWaypoint.deleteMany();
    await tx.round.deleteMany();
  });

  console.log('Готово: все сборы и заказы удалены.');
  console.log('Сохранены: пользователи, населённые пункты, каталог, маршруты-шаблоны, заявки водителей.');
  console.log('В браузере: Ctrl+F5, при необходимости выйти и войти снова.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
