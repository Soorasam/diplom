import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { decimalToNumber, ORDER_STATUS_LABELS } from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async list(user: User) {
    const orders = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: { round: { include: { route: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => {
      const routeTitle = order.round.title ?? order.round.route.title;
      return {
        id: order.id,
        publicNumber: order.publicNumber,
        title: `Сбор «${routeTitle}»`,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status],
        expectedAt: order.expectedAt,
        createdAt: order.createdAt,
      };
    });
  }

  async getOne(user: User, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: {
        items: true,
        round: { include: { route: true } },
      },
    });
    if (!order) throw new NotFoundException('Заказ не найден');

    const title = order.round.title ?? order.round.route.title;
    return {
      id: order.id,
      publicNumber: order.publicNumber,
      roundId: order.roundId,
      status: order.status,
      totalEstimate: decimalToNumber(order.totalEstimate),
      statusNote: order.statusNote,
      expectedAt: order.expectedAt,
      createdAt: order.createdAt,
      title,
      items: order.items.map((i) => ({
        ...i,
        priceSnapshot: decimalToNumber(i.priceSnapshot),
      })),
    };
  }
}
