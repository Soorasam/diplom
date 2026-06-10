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



type RouteStopRow = {

  pickupPointId: string;

  sortOrder: number;

  status: DeliveryStopStatus;

  isProcurementStop: boolean;

  procurementCompletedAt: Date | null;

};



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



  /**

   * После выезда с точки закупа — в путь только заказы до следующей закупки,

   * у которых все позиции уже закуплены.

   */

  async releaseReadyOrdersToTransit(

    roundId: string,

    departedProcurementSortOrder?: number,

  ) {

    const stops = await this.getStopsForRound(roundId);

    if (stops.length === 0) {

      return { ordersDispatched: 0 };

    }



    if (departedProcurementSortOrder === undefined) {

      const openProcStops = stops.filter(

        (s) => s.isProcurementStop && !s.procurementCompletedAt,

      ).length;

      if (openProcStops > 0) {

        return { ordersDispatched: 0 };

      }

    }



    const maxDeliverySort = this.maxDeliverySortAfterProcurement(

      stops,

      departedProcurementSortOrder,

    );



    const orders = await this.prisma.order.findMany({

      where: {

        roundId,

        status: OrderStatus.confirmed,

      },

      include: { items: true },

    });



    const stopSortByPickup = new Map(

      stops.map((s) => [s.pickupPointId, s.sortOrder]),

    );



    const readyIds = orders

      .filter((o) => {

        if (!o.pickupPointId) return false;

        if (

          o.items.some(

            (i) => i.procurementStatus === OrderItemProcurementStatus.pending,

          )

        ) {

          return false;

        }

        const deliverySort = stopSortByPickup.get(o.pickupPointId);

        if (deliverySort === undefined) return false;

        if (departedProcurementSortOrder !== undefined) {

          if (deliverySort <= departedProcurementSortOrder) return false;

          if (deliverySort > maxDeliverySort) return false;

        }

        return true;

      })

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



  private maxDeliverySortAfterProcurement(

    stops: RouteStopRow[],

    departedProcurementSortOrder?: number,

  ) {

    if (departedProcurementSortOrder === undefined) {

      return stops[stops.length - 1]?.sortOrder ?? 0;

    }



    const nextProc = stops.find(

      (s) =>

        s.isProcurementStop &&

        !s.procurementCompletedAt &&

        s.sortOrder > departedProcurementSortOrder,

    );



    if (!nextProc) {

      return stops[stops.length - 1]?.sortOrder ?? departedProcurementSortOrder;

    }



    return nextProc.sortOrder - 1;

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



  /** in_progress только если все предыдущие точки завершены */

  private async markInTransitStopsInProgress(roundId: string) {

    const stops = await this.getStopsForRound(roundId);



    for (const stop of stops) {

      const priorCompleted = stops

        .filter((s) => s.sortOrder < stop.sortOrder)

        .every((s) => s.status === DeliveryStopStatus.completed);

      if (!priorCompleted) continue;



      const inTransit = await this.prisma.order.count({

        where: {

          roundId,

          pickupPointId: stop.pickupPointId,

          status: OrderStatus.in_transit,

        },

      });

      if (inTransit === 0) continue;



      await this.markStopInProgress(roundId, stop.pickupPointId);

    }

  }



  async assertResidentCanConfirmReceipt(roundId: string, pickupPointId: string) {
    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
      include: { pickupPoint: true },
    });
    if (!stop) {
      throw new BadRequestException('Точка выдачи не найдена в маршруте');
    }
    if (stop.status !== DeliveryStopStatus.in_progress) {
      throw new BadRequestException(
        `Водитель ещё не приехал в «${stop.pickupPoint.name}» — подтверждение пока недоступно`,
      );
    }
  }

  async assertDriverCanHandOutAtStop(roundId: string, pickupPointId: string) {
    await this.assertCurrentStopForDriver(roundId, pickupPointId);

    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
    });
    if (!stop || stop.status !== DeliveryStopStatus.in_progress) {
      throw new BadRequestException(
        'Выдача доступна только на текущей точке маршрута',
      );
    }
  }

  async markStopInProgress(roundId: string, pickupPointId: string) {

    const stops = await this.getStopsForRound(roundId);

    const stop = stops.find((s) => s.pickupPointId === pickupPointId);

    if (!stop || stop.status === DeliveryStopStatus.completed) return;



    const priorCompleted = stops

      .filter((s) => s.sortOrder < stop.sortOrder)

      .every((s) => s.status === DeliveryStopStatus.completed);

    if (!priorCompleted) return;



    await this.prisma.roundDeliveryStop.updateMany({

      where: {

        roundId,

        pickupPointId,

        status: DeliveryStopStatus.pending,

      },

      data: { status: DeliveryStopStatus.in_progress },

    });

  }



  async assertCurrentStopForDriver(roundId: string, pickupPointId: string) {

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

  }



  async completeStopByDriver(roundId: string, pickupPointId: string) {

    await this.assertCurrentStopForDriver(roundId, pickupPointId);



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

        'Сначала завершите закупку: чек-лист и кнопка «Поехали»',

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



    await this.activateNextStop(roundId, stop.sortOrder);



    const roundCompleted = await this.isRoundFullyCompleted(roundId);

    return { stopCompleted: true, roundCompleted };

  }



  /** Следующая точка становится in_progress — водитель закрывает каждый этап сам */

  private async activateNextStop(roundId: string, completedSortOrder: number) {

    const next = await this.prisma.roundDeliveryStop.findFirst({

      where: {

        roundId,

        sortOrder: { gt: completedSortOrder },

        status: { not: DeliveryStopStatus.completed },

      },

      orderBy: { sortOrder: 'asc' },

    });

    if (!next || next.status === DeliveryStopStatus.in_progress) return;

    await this.markStopInProgress(roundId, next.pickupPointId);

  }



  /** Без автозакрытия — только если все этапы уже завершены вручную */

  async repairRoundIfWorkComplete(roundId: string) {

    if (!(await this.isRoundFullyCompleted(roundId))) {

      return false;

    }



    const round = await this.prisma.round.findUnique({

      where: { id: roundId },

      select: { status: true },

    });

    if (round?.status === RoundStatus.fulfilled) {

      return false;

    }



    await this.prisma.round.update({

      where: { id: roundId },

      data: { status: RoundStatus.fulfilled },

    });

    return true;

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

        stopReadyForDriver: stop.status !== DeliveryStopStatus.completed,

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



  async getStopsForRound(roundId: string): Promise<RouteStopRow[]> {

    return this.prisma.roundDeliveryStop.findMany({

      where: { roundId },

      orderBy: { sortOrder: 'asc' },

      select: {

        pickupPointId: true,

        sortOrder: true,

        status: true,

        isProcurementStop: true,

        procurementCompletedAt: true,

      },

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


