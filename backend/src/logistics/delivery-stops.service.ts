import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
        status: OrderStatus.submitted,
      },
      data: {
        status: OrderStatus.confirmed,
        statusNote: ORDER_STATUS_LABELS.confirmed,
      },
    });

    return { ordersDispatched: count, awaitingProcurement: true };
  }

  async releaseOrdersToTransit(roundId: string) {
    const { count } = await this.prisma.order.updateMany({
      where: {
        roundId,
        status: OrderStatus.confirmed,
      },
      data: {
        status: OrderStatus.in_transit,
        statusNote: ORDER_STATUS_LABELS.in_transit,
      },
    });

    await this.markInTransitStopsInProgress(roundId);

    return { ordersDispatched: count };
  }

  async syncStopsForRound(roundId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: {
        waypoints: { orderBy: { sortOrder: 'asc' } },
        orders: {
          where: {
            pickupPointId: { not: null },
            status: { not: OrderStatus.cancelled },
          },
          select: { pickupPointId: true },
        },
      },
    });
    if (!round) return;

    const orderedIds: string[] = [];
    const seen = new Set<string>();
    const push = (id: string) => {
      if (!seen.has(id)) {
        seen.add(id);
        orderedIds.push(id);
      }
    };

    for (const wp of round.waypoints) {
      push(wp.pickupPointId);
    }

    for (const order of round.orders) {
      if (order.pickupPointId) push(order.pickupPointId);
    }

    const procurementIds = new Set(
      round.waypoints.filter((w) => w.isProcurementPoint).map((w) => w.pickupPointId),
    );

    let sortOrder = 0;
    for (const pickupPointId of orderedIds) {
      const isProcurementStop = procurementIds.has(pickupPointId);
      await this.prisma.roundDeliveryStop.upsert({
        where: {
          uq_round_delivery_stop: {
            roundId,
            pickupPointId,
          },
        },
        create: {
          roundId,
          pickupPointId,
          sortOrder: sortOrder++,
          status: DeliveryStopStatus.pending,
          isProcurementStop,
        },
        update: { sortOrder: sortOrder++, isProcurementStop },
      });
    }
  }

  private async markInTransitStopsInProgress(roundId: string) {
    const inTransitByPvz = await this.prisma.order.groupBy({
      by: ['pickupPointId'],
      where: {
        roundId,
        status: OrderStatus.in_transit,
        pickupPointId: { not: null },
      },
    });

    for (const row of inTransitByPvz) {
      if (!row.pickupPointId) continue;
      await this.markStopInProgress(roundId, row.pickupPointId);
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

  async completeStopByDriver(roundId: string, pickupPointId: string) {
    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
    });
    if (!stop) throw new NotFoundException('Точка маршрута не найдена');

    const ordersAtStop = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: { not: OrderStatus.cancelled },
      },
    });
    const unresolvedOrders = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: {
          in: [OrderStatus.submitted, OrderStatus.confirmed, OrderStatus.in_transit],
        },
      },
    });
    if (ordersAtStop > 0 && unresolvedOrders > 0) {
      throw new BadRequestException(
        'На этой точке ещё есть незавершённые заказы — завершите выдачу жителям',
      );
    }

    if (stop.isProcurementStop && !stop.procurementCompletedAt) {
      throw new BadRequestException(
        'Сначала завершите закупку: чек-лист и кнопка «В пути»',
      );
    }

    if (stop.status === DeliveryStopStatus.completed) {
      return { stopCompleted: true, roundCompleted: await this.isRoundFullyCompleted(roundId) };
    }

    await this.prisma.roundDeliveryStop.update({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
      data: {
        status: DeliveryStopStatus.completed,
        completedAt: new Date(),
      },
    });

    const roundCompleted = await this.isRoundFullyCompleted(roundId);
    return { stopCompleted: true, roundCompleted };
  }

  private async isRoundFullyCompleted(roundId: string) {
    const openStops = await this.prisma.roundDeliveryStop.count({
      where: {
        roundId,
        status: { not: DeliveryStopStatus.completed },
      },
    });
    return openStops === 0;
  }

  async refreshStopCompletion(roundId: string, pickupPointId: string) {
    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: {
        uq_round_delivery_stop: { roundId, pickupPointId },
      },
    });
    if (!stop) {
      return { stopCompleted: false, stopReadyForDriver: false, roundCompleted: false };
    }

    const ordersAtStop = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: { not: OrderStatus.cancelled },
      },
    });
    if (ordersAtStop === 0) {
      const roundCompleted =
        stop.status === DeliveryStopStatus.completed
          ? await this.isRoundFullyCompleted(roundId)
          : false;
      return {
        stopCompleted: stop.status === DeliveryStopStatus.completed,
        stopReadyForDriver: false,
        roundCompleted,
      };
    }

    const inTransit = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: OrderStatus.in_transit,
      },
    });

    if (inTransit > 0) {
      await this.markStopInProgress(roundId, pickupPointId);
      return { stopCompleted: false, stopReadyForDriver: false, roundCompleted: false };
    }

    const activeAtPvz = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: { in: [OrderStatus.at_pickup, OrderStatus.delivered] },
      },
    });

    if (activeAtPvz < ordersAtStop) {
      return { stopCompleted: false, stopReadyForDriver: false, roundCompleted: false };
    }

    if (stop.isProcurementStop && !stop.procurementCompletedAt) {
      return { stopCompleted: false, stopReadyForDriver: false, roundCompleted: false };
    }

    await this.markStopInProgress(roundId, pickupPointId);
    const stopCompleted = stop.status === DeliveryStopStatus.completed;
    const roundCompleted = stopCompleted
      ? await this.isRoundFullyCompleted(roundId)
      : false;

    return {
      stopCompleted,
      stopReadyForDriver: true,
      roundCompleted,
    };
  }

  async completeProcurementStopIfNoOrders(roundId: string, pickupPointId: string) {
    const ordersAtStop = await this.prisma.order.count({
      where: {
        roundId,
        pickupPointId,
        status: { not: OrderStatus.cancelled },
      },
    });
    if (ordersAtStop > 0) return;

    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
    });
    if (!stop || stop.status === DeliveryStopStatus.completed) return;

    await this.prisma.roundDeliveryStop.update({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
      data: {
        status: DeliveryStopStatus.completed,
        completedAt: new Date(),
      },
    });
  }

  async getStopsForRound(roundId: string) {
    return this.prisma.roundDeliveryStop.findMany({
      where: { roundId },
      include: { pickupPoint: true },
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
