import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStopStatus,
  OrderItemProcurementStatus,
  OrderStatus,
  Prisma,
  RoundStatus,
} from '@prisma/client';
import { ORDER_STATUS_LABELS } from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryStopsService {
  constructor(private prisma: PrismaService) {}

  /** Подготавливает точки маршрута при закрытии сбора. Статус заказов не меняет — принятие в рейс только вручную водителем. */
  async dispatchRound(roundId: string) {
    await this.syncStopsForRound(roundId);
    return { awaitingProcurement: true };
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

  /** Отправляет в доставку заказы, по которым закупка уже завершена (нет pending позиций) */
  async releaseReadyOrdersToTransit(roundId: string) {
    const openProcStops = await this.prisma.roundDeliveryStop.count({
      where: {
        roundId,
        isProcurementStop: true,
        procurementCompletedAt: null,
      },
    });
    if (openProcStops > 0) {
      return { ordersDispatched: 0 };
    }

    const orders = await this.prisma.order.findMany({
      where: {
        roundId,
        status: OrderStatus.confirmed,
      },
      include: { items: true },
    });

    const readyIds = orders
      .filter(
        (o) =>
          !o.items.some(
            (i) => i.procurementStatus === OrderItemProcurementStatus.pending,
          ),
      )
      .map((o) => o.id);

    if (readyIds.length === 0) {
      return { ordersDispatched: 0 };
    }

    const { count } = await this.prisma.order.updateMany({
      where: { id: { in: readyIds } },
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

    if (orderedIds.length > 0) {
      await this.prisma.roundDeliveryStop.deleteMany({
        where: {
          roundId,
          pickupPointId: { notIn: orderedIds },
        },
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
    const orderedStops = await this.prisma.roundDeliveryStop.findMany({
      where: { roundId },
      include: { pickupPoint: true },
      orderBy: { sortOrder: 'asc' },
    });
    const firstIncomplete = orderedStops.find(
      (s) => s.status !== DeliveryStopStatus.completed,
    );
    if (firstIncomplete && firstIncomplete.pickupPointId !== pickupPointId) {
      throw new BadRequestException(
        `Сначала завершите «${firstIncomplete.pickupPoint.name}» — маршрут строго по порядку`,
      );
    }

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

    await this.autoCompleteTrailingEmptyStops(roundId, stop.sortOrder);

    const roundCompleted = await this.isRoundFullyCompleted(roundId);
    return { stopCompleted: true, roundCompleted };
  }

  /** Пустые точки «проезд» в хвосте маршрута не должны блокировать завершение рейса */
  private async autoCompleteTrailingEmptyStops(
    roundId: string,
    afterSortOrder: number,
  ) {
    const trailing = await this.prisma.roundDeliveryStop.findMany({
      where: { roundId, sortOrder: { gt: afterSortOrder } },
      orderBy: { sortOrder: 'asc' },
    });

    for (const stop of trailing) {
      const ordersAtStop = await this.prisma.order.count({
        where: {
          roundId,
          pickupPointId: stop.pickupPointId,
          status: { not: OrderStatus.cancelled },
        },
      });
      if (ordersAtStop > 0) break;
      if (stop.isProcurementStop && !stop.procurementCompletedAt) break;
      if (stop.status === DeliveryStopStatus.completed) continue;

      await this.prisma.roundDeliveryStop.update({
        where: {
          uq_round_delivery_stop: { roundId, pickupPointId: stop.pickupPointId },
        },
        data: {
          status: DeliveryStopStatus.completed,
          completedAt: new Date(),
        },
      });
    }
  }

  /** Закрывает «застрявшие» закупки, если маршрут уже ушёл дальше по этапам */
  async repairStuckProcurementStops(roundId: string) {
    const stops = await this.prisma.roundDeliveryStop.findMany({
      where: { roundId },
      orderBy: { sortOrder: 'asc' },
    });

    for (const stop of stops) {
      if (!stop.isProcurementStop || stop.procurementCompletedAt) continue;

      const pendingItems = await this.prisma.orderItem.count({
        where: {
          procurementPickupPointId: stop.pickupPointId,
          procurementStatus: OrderItemProcurementStatus.pending,
          order: { roundId, status: { not: OrderStatus.cancelled } },
        },
      });
      if (pendingItems > 0) continue;

      const routeProgressedPast = stops.some(
        (s) =>
          s.sortOrder > stop.sortOrder &&
          s.status === DeliveryStopStatus.completed,
      );
      if (!routeProgressedPast) continue;

      await this.prisma.roundDeliveryStop.update({
        where: {
          uq_round_delivery_stop: { roundId, pickupPointId: stop.pickupPointId },
        },
        data: {
          procurementCompletedAt: new Date(),
          status: DeliveryStopStatus.completed,
          completedAt: new Date(),
        },
      });
    }
  }

  /** Старые незакрытые сборы после более нового рейса — автозавершение */
  async fulfillSupersededRounds(driverId: string) {
    const rounds = await this.prisma.round.findMany({
      where: {
        createdByUserId: driverId,
        status: { in: [RoundStatus.closed, RoundStatus.fulfilled] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    });
    if (rounds.length < 2) return;

    for (const round of rounds.slice(1)) {
      if (round.status === RoundStatus.fulfilled) continue;
      await this.repairStuckProcurementStops(round.id);
      await this.repairRoundIfWorkComplete(round.id);
      const row = await this.prisma.round.findUnique({
        where: { id: round.id },
        select: { status: true },
      });
      if (row?.status !== RoundStatus.closed) continue;
      if (!(await this.isRoundFullyCompleted(round.id))) {
        await this.forceFulfillRound(round.id);
      }
    }
  }

  private async forceFulfillRound(roundId: string) {
    await this.prisma.roundDeliveryStop.updateMany({
      where: {
        roundId,
        status: { not: DeliveryStopStatus.completed },
      },
      data: {
        status: DeliveryStopStatus.completed,
        completedAt: new Date(),
      },
    });
    await this.prisma.roundDeliveryStop.updateMany({
      where: { roundId, isProcurementStop: true, procurementCompletedAt: null },
      data: { procurementCompletedAt: new Date() },
    });
    await this.prisma.round.update({
      where: { id: roundId },
      data: { status: RoundStatus.fulfilled },
    });
  }

  /** Закрывает пустые точки «проезд» в хвосте, если все рабочие этапы уже пройдены */
  async repairRoundIfWorkComplete(roundId: string) {
    await this.repairStuckProcurementStops(roundId);

    const stops = await this.prisma.roundDeliveryStop.findMany({
      where: { roundId },
      orderBy: { sortOrder: 'asc' },
    });
    if (stops.length === 0) return false;

    for (const stop of stops) {
      const ordersAtStop = await this.prisma.order.count({
        where: {
          roundId,
          pickupPointId: stop.pickupPointId,
          status: { not: OrderStatus.cancelled },
        },
      });
      const isMeaningful = stop.isProcurementStop || ordersAtStop > 0;
      if (!isMeaningful) continue;

      if (stop.isProcurementStop) {
        if (!stop.procurementCompletedAt) return false;
        if (stop.status !== DeliveryStopStatus.completed) return false;
        continue;
      }

      if (stop.status !== DeliveryStopStatus.completed) return false;
    }

    let repaired = false;
    for (const stop of stops) {
      if (stop.status === DeliveryStopStatus.completed) continue;
      await this.prisma.roundDeliveryStop.update({
        where: {
          uq_round_delivery_stop: { roundId, pickupPointId: stop.pickupPointId },
        },
        data: {
          status: DeliveryStopStatus.completed,
          completedAt: new Date(),
        },
      });
      repaired = true;
    }

    if (repaired && (await this.isRoundFullyCompleted(roundId))) {
      await this.prisma.round.update({
        where: { id: roundId },
        data: { status: RoundStatus.fulfilled },
      });
    }

    return repaired;
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
    if (
      !stop ||
      stop.status === DeliveryStopStatus.completed ||
      !stop.procurementCompletedAt
    ) {
      return;
    }

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
    orders: {
      status: OrderStatus;
      pickupPointId: string | null;
      userId: string;
    }[],
    pickupPointId: string,
  ) {
    const scoped = orders.filter(
      (o) =>
        o.pickupPointId === pickupPointId && o.status !== OrderStatus.cancelled,
    );
    const byUser = new Map<string, typeof scoped>();
    for (const order of scoped) {
      const list = byUser.get(order.userId) ?? [];
      list.push(order);
      byUser.set(order.userId, list);
    }
    const groups = [...byUser.values()];

    return {
      total: groups.length,
      inTransit: groups.filter((g) =>
        g.some((o) => o.status === OrderStatus.in_transit),
      ).length,
      atPickup: groups.filter((g) =>
        g.some((o) => o.status === OrderStatus.at_pickup),
      ).length,
      delivered: groups.filter((g) =>
        g.every((o) => o.status === OrderStatus.delivered),
      ).length,
      received: groups.filter((g) =>
        g.every((o) => o.status === OrderStatus.delivered),
      ).length,
    };
  }
}
