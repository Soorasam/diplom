import { Injectable } from '@nestjs/common';
import { DeliveryStopStatus, OrderStatus, Prisma } from '@prisma/client';
import { ORDER_STATUS_LABELS } from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryStopsService {
  constructor(private prisma: PrismaService) {}

  
  
  async dispatchRound(roundId: string) {
    await this.syncStopsForRound(roundId);

    await this.prisma.order.updateMany({
      where: { roundId, status: OrderStatus.submitted },
      data: {
        status: OrderStatus.confirmed,
        statusNote: ORDER_STATUS_LABELS.confirmed,
      },
    });

    const { count } = await this.prisma.order.updateMany({
      where: {
        roundId,
        status: { in: [OrderStatus.confirmed, OrderStatus.submitted] },
      },
      data: {
        status: OrderStatus.in_transit,
        statusNote: ORDER_STATUS_LABELS.in_transit,
      },
    });

    return { ordersDispatched: count };
  }

  async syncStopsForRound(roundId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        roundId,
        pickupPointId: { not: null },
        status: { not: OrderStatus.cancelled },
      },
      select: { pickupPointId: true },
      distinct: ['pickupPointId'],
    });

    let sortOrder = 0;
    for (const row of orders) {
      if (!row.pickupPointId) continue;
      await this.prisma.roundDeliveryStop.upsert({
        where: {
          uq_round_delivery_stop: {
            roundId,
            pickupPointId: row.pickupPointId,
          },
        },
        create: {
          roundId,
          pickupPointId: row.pickupPointId,
          sortOrder: sortOrder++,
          status: DeliveryStopStatus.pending,
        },
        update: {},
      });
    }
  }

  async markStopInProgress(roundId: string, pickupPointId: string) {
    await this.prisma.roundDeliveryStop.updateMany({
      where: {
        roundId,
        pickupPointId,
        status: DeliveryStopStatus.pending,
      },
      data: { status: DeliveryStopStatus.in_progress },
    });
  }

  
  async refreshStopCompletion(roundId: string, pickupPointId: string) {
    const inTransit = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: OrderStatus.in_transit,
      },
    });

    if (inTransit > 0) {
      await this.markStopInProgress(roundId, pickupPointId);
      return { stopCompleted: false, roundCompleted: false };
    }

    const activeAtPvz = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: { in: [OrderStatus.at_pickup, OrderStatus.delivered] },
      },
    });

    if (activeAtPvz === 0) {
      return { stopCompleted: false, roundCompleted: false };
    }

    await this.prisma.roundDeliveryStop.update({
      where: {
        uq_round_delivery_stop: { roundId, pickupPointId },
      },
      data: {
        status: DeliveryStopStatus.completed,
        completedAt: new Date(),
      },
    });

    const openStops = await this.prisma.roundDeliveryStop.count({
      where: {
        roundId,
        status: { not: DeliveryStopStatus.completed },
      },
    });

    return {
      stopCompleted: true,
      roundCompleted: openStops === 0,
    };
  }

  async getStopsForRound(roundId: string) {
    return this.prisma.roundDeliveryStop.findMany({
      where: { roundId },
      include: {
        pickupPoint: { include: { settlement: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  orderCountsForStop(
    orders: { status: OrderStatus; pickupPointId: string | null }[],
    pickupPointId: string,
  ) {
    const scoped = orders.filter((o) => o.pickupPointId === pickupPointId);
    return {
      total: scoped.filter((o) => o.status !== OrderStatus.cancelled).length,
      inTransit: scoped.filter((o) => o.status === OrderStatus.in_transit).length,
      atPickup: scoped.filter((o) => o.status === OrderStatus.at_pickup).length,
      delivered: scoped.filter((o) => o.status === OrderStatus.delivered).length,
      received: scoped.filter(
        (o) => o.status === OrderStatus.at_pickup || o.status === OrderStatus.delivered,
      ).length,
    };
  }
}
