import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStopStatus,
  OrderItemProcurementStatus,
  OrderStatus,
  Prisma,
  RoundStatus,
  User,
  UserRole,
} from '@prisma/client';
import { ORDER_STATUS_LABELS, decimalToNumber } from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStopsService } from './delivery-stops.service';
import {
  ProcurementChecklistItemDto,
  ProcurementItemOutcome,
} from './dto/submit-procurement-checklist.dto';

@Injectable()
export class ProcurementChecklistService {
  constructor(
    private prisma: PrismaService,
    private deliveryStops: DeliveryStopsService,
  ) {}

  async initForRound(roundId: string) {
    await this.initItemsForAcceptedOrders(roundId);
  }

  /** Позиции закупки только для заказов, принятых водителем в рейс */
  async initItemsForAcceptedOrders(roundId: string, orderIds?: string[]) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: {
        waypoints: { orderBy: { sortOrder: 'asc' } },
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.confirmed,
                OrderStatus.in_transit,
                OrderStatus.at_pickup,
                OrderStatus.delivered,
              ],
            },
            ...(orderIds?.length ? { id: { in: orderIds } } : {}),
          },
          include: { items: true },
        },
      },
    });
    if (!round) return;

    const procurementPoints = round.waypoints.filter((w) => w.isProcurementPoint);
    const firstProc = procurementPoints[0];
    if (!firstProc) return;

    const itemIds = round.orders.flatMap((o) => o.items.map((i) => i.id));
    if (itemIds.length === 0) return;

    await this.prisma.orderItem.updateMany({
      where: { id: { in: itemIds }, procurementStatus: OrderItemProcurementStatus.pending },
      data: {
        procurementPickupPointId: firstProc.pickupPointId,
        procurementStatus: OrderItemProcurementStatus.pending,
      },
    });
  }

  private async assertDriverRound(user: User, roundId: string) {
    const round = await this.prisma.round.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status === RoundStatus.open) {
      throw new BadRequestException('Сначала закройте сбор');
    }
    if (
      user.role === UserRole.coordinator &&
      round.createdByUserId !== user.id
    ) {
      throw new ForbiddenException('Нет доступа к этому сбору');
    }
    return round;
  }

  private procurementWaypoints(roundId: string) {
    return this.prisma.roundWaypoint.findMany({
      where: { roundId, isProcurementPoint: true },
      orderBy: { sortOrder: 'asc' },
      include: { pickupPoint: true },
    });
  }

  private nextProcurementPickupPointId(
    waypoints: { pickupPointId: string; sortOrder: number }[],
    currentPickupPointId: string,
  ): string | null {
    const sorted = [...waypoints].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((w) => w.pickupPointId === currentPickupPointId);
    if (idx < 0 || idx >= sorted.length - 1) return null;
    return sorted[idx + 1].pickupPointId;
  }

  private async routeStopSortMap(roundId: string) {
    const stops = await this.prisma.roundDeliveryStop.findMany({
      where: { roundId },
      orderBy: { sortOrder: 'asc' },
      select: { pickupPointId: true, sortOrder: true },
    });
    return new Map(stops.map((s) => [s.pickupPointId, s.sortOrder]));
  }

  /** Перенос возможен, если следующая закупка не позже посёлка доставки заказа */
  private canDeferItemToNextProcurement(
    routeSort: Map<string, number>,
    nextProcPickupPointId: string,
    deliveryPickupPointId: string | null,
  ): boolean {
    if (!deliveryPickupPointId) return false;
    const nextSort = routeSort.get(nextProcPickupPointId);
    const deliverySort = routeSort.get(deliveryPickupPointId);
    if (nextSort === undefined || deliverySort === undefined) return false;
    return nextSort <= deliverySort;
  }

  async getActiveChecklist(user: User, roundId: string) {
    await this.assertDriverRound(user, roundId);

    const stops = await this.prisma.roundDeliveryStop.findMany({
      where: { roundId },
      orderBy: { sortOrder: 'asc' },
      include: { pickupPoint: true },
    });

    const current = stops.find((s) => s.status !== DeliveryStopStatus.completed);
    if (
      !current?.isProcurementStop ||
      current.procurementCompletedAt != null
    ) {
      return { active: false as const };
    }

    return this.buildChecklistPayload(
      roundId,
      current.pickupPointId,
      current.pickupPoint,
    );
  }

  async getChecklist(user: User, roundId: string, pickupPointId: string) {
    await this.assertDriverRound(user, roundId);
    const pp = await this.prisma.pickupPoint.findUnique({
      where: { id: pickupPointId },
    });
    if (!pp) throw new NotFoundException('Точка не найдена');
    return this.buildChecklistPayload(roundId, pickupPointId, pp);
  }

  private async buildChecklistPayload(
    roundId: string,
    pickupPointId: string,
    pickupPoint: { id: string; name: string; address: string | null },
  ) {
    const waypoints = await this.procurementWaypoints(roundId);
    const nextId = this.nextProcurementPickupPointId(waypoints, pickupPointId);
    const nextWp = nextId
      ? waypoints.find((w) => w.pickupPointId === nextId)
      : null;
    const routeSort = await this.routeStopSortMap(roundId);

    const lines = await this.prisma.orderItem.findMany({
      where: {
        procurementPickupPointId: pickupPointId,
        procurementStatus: OrderItemProcurementStatus.pending,
        order: {
          roundId,
          status: {
            in: [
              OrderStatus.confirmed,
              OrderStatus.in_transit,
              OrderStatus.at_pickup,
              OrderStatus.delivered,
            ],
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            publicNumber: true,
            userId: true,
            pickupPointId: true,
            pickupPoint: { select: { name: true } },
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: [{ productName: 'asc' }, { orderId: 'asc' }],
    });

    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: {
        uq_round_delivery_stop: { roundId, pickupPointId },
      },
    });

    return {
      active: true as const,
      roundId,
      pickupPointId,
      locationName: pickupPoint.name,
      address: pickupPoint.address?.trim() || pickupPoint.name,
      hasNextProcurementPoint: Boolean(nextId),
      nextProcurementName: nextWp?.pickupPoint.name ?? null,
      procurementCompleted: Boolean(stop?.procurementCompletedAt),
      items: lines.map((line) => ({
        orderItemId: line.id,
        orderId: line.orderId,
        orderNumber: line.order.publicNumber,
        residentId: line.order.userId,
        residentName: line.order.user.fullName ?? line.order.user.email,
        deliveryPickupPointId: line.order.pickupPointId,
        deliverySettlementName: line.order.pickupPoint?.name ?? '—',
        canDeferToNextProcurement: nextId
          ? this.canDeferItemToNextProcurement(
              routeSort,
              nextId,
              line.order.pickupPointId,
            )
          : false,
        productId: line.productId,
        productName: line.productName,
        quantity: line.quantity,
        unit: line.unit,
        lineTotal: decimalToNumber(line.priceSnapshot) * line.quantity,
      })),
    };
  }

  async submitChecklist(
    user: User,
    roundId: string,
    pickupPointId: string,
    items: ProcurementChecklistItemDto[],
  ) {
    await this.assertDriverRound(user, roundId);
    await this.deliveryStops.assertCurrentStopForDriver(roundId, pickupPointId);

    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
    });
    if (!stop?.isProcurementStop) {
      throw new BadRequestException('Это не точка закупа');
    }
    if (stop.procurementCompletedAt) {
      throw new BadRequestException('Чек-лист на этой точке уже завершён');
    }

    const waypoints = await this.procurementWaypoints(roundId);
    const nextProcId = this.nextProcurementPickupPointId(waypoints, pickupPointId);
    const routeSort = await this.routeStopSortMap(roundId);

    const pending = await this.prisma.orderItem.findMany({
      where: {
        procurementPickupPointId: pickupPointId,
        procurementStatus: OrderItemProcurementStatus.pending,
        order: { roundId, status: { not: OrderStatus.cancelled } },
      },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            publicNumber: true,
            totalEstimate: true,
            pickupPointId: true,
          },
        },
      },
    });

    const pendingIds = new Set(pending.map((p) => p.id));
    const submittedIds = new Set(items.map((i) => i.orderItemId));

    if (pendingIds.size !== submittedIds.size) {
      throw new BadRequestException('Отметьте все позиции в чек-листе');
    }
    for (const id of submittedIds) {
      if (!pendingIds.has(id)) {
        throw new BadRequestException('Некорректная позиция чек-листа');
      }
    }

    const refunds: { userId: string; orderNumber: string; productName: string; amount: number }[] =
      [];

    await this.prisma.$transaction(async (tx) => {
      for (const entry of items) {
        const line = pending.find((p) => p.id === entry.orderItemId)!;
        const lineTotal = new Prisma.Decimal(line.priceSnapshot).mul(line.quantity);

        if (entry.outcome === ProcurementItemOutcome.purchased) {
          await tx.orderItem.update({
            where: { id: line.id },
            data: { procurementStatus: OrderItemProcurementStatus.purchased },
          });
          continue;
        }

        if (entry.outcome === ProcurementItemOutcome.defer_next) {
          if (!nextProcId) {
            throw new BadRequestException(
              'Нет следующей точки закупа — отметьте «Нет в наличии»',
            );
          }
          if (
            !this.canDeferItemToNextProcurement(
              routeSort,
              nextProcId,
              line.order.pickupPointId,
            )
          ) {
            throw new BadRequestException(
              'Для этого заказа нельзя перенести закупку на следующую точку — отметьте «Нет в наличии»',
            );
          }
          await tx.orderItem.update({
            where: { id: line.id },
            data: {
              procurementPickupPointId: nextProcId!,
              procurementStatus: OrderItemProcurementStatus.pending,
            },
          });
          continue;
        }

        if (
          entry.outcome === ProcurementItemOutcome.unavailable &&
          nextProcId &&
          this.canDeferItemToNextProcurement(
            routeSort,
            nextProcId,
            line.order.pickupPointId,
          )
        ) {
          throw new BadRequestException(
            'Есть следующая точка закупа — отметьте «Закуплю в следующей точке»',
          );
        }

        await tx.orderItem.update({
          where: { id: line.id },
          data: { procurementStatus: OrderItemProcurementStatus.refunded },
        });

        const newTotal = new Prisma.Decimal(line.order.totalEstimate).sub(lineTotal);
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: line.orderId },
        });
        const allRefunded = orderItems.every(
          (i) =>
            i.id === line.id ||
            i.procurementStatus === OrderItemProcurementStatus.refunded,
        );

        if (allRefunded) {
          await tx.order.update({
            where: { id: line.orderId },
            data: {
              status: OrderStatus.cancelled,
              statusNote: ORDER_STATUS_LABELS.cancelled,
              totalEstimate: 0,
            },
          });
        } else {
          await tx.order.update({
            where: { id: line.orderId },
            data: {
              totalEstimate: newTotal.lt(0) ? 0 : newTotal,
              statusNote: 'Частичный возврат: товар не найден',
            },
          });
        }

        refunds.push({
          userId: line.order.userId,
          orderNumber: line.order.publicNumber,
          productName: line.productName,
          amount: decimalToNumber(lineTotal),
        });
      }
    });

    for (const r of refunds) {
      await this.prisma.notification.create({
        data: {
          userId: r.userId,
          title: `Возврат по заказу ${r.orderNumber}`,
          body: `«${r.productName}» не было в наличии на точке закупа. Сумма ${r.amount.toFixed(0)} ₽ возвращена на баланс (симуляция).`,
          read: false,
        },
      });
    }

    const remaining = await this.prisma.orderItem.count({
      where: {
        procurementPickupPointId: pickupPointId,
        procurementStatus: OrderItemProcurementStatus.pending,
        order: { roundId },
      },
    });

    return {
      ok: true,
      remainingAtStop: remaining,
      refundsCount: refunds.length,
      canDepart: remaining === 0,
    };
  }

  async departProcurement(user: User, roundId: string, pickupPointId: string) {
    await this.assertDriverRound(user, roundId);
    await this.deliveryStops.assertCurrentStopForDriver(roundId, pickupPointId);

    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
    });
    if (!stop?.isProcurementStop) {
      throw new BadRequestException('Это не точка закупа');
    }

    const pending = await this.prisma.orderItem.count({
      where: {
        procurementPickupPointId: pickupPointId,
        procurementStatus: OrderItemProcurementStatus.pending,
        order: { roundId, status: { not: OrderStatus.cancelled } },
      },
    });
    if (pending > 0) {
      throw new BadRequestException('Сначала заполните чек-лист по всем позициям');
    }

    const receiptCount = await this.prisma.roundProcurementReceipt.count({
      where: { roundId, pickupPointId },
    });
    if (receiptCount === 0) {
      throw new BadRequestException('Прикрепите фото чека перед выездом');
    }

    const openProcStops = await this.prisma.roundDeliveryStop.count({
      where: {
        roundId,
        isProcurementStop: true,
        procurementCompletedAt: null,
      },
    });
    if (openProcStops === 1) {
      const round = await this.prisma.round.findUnique({ where: { id: roundId } });
      if (!round?.purchaseSettledAt) {
        throw new BadRequestException('Укажите сумму по чекам и проведите сверку');
      }
    }

    await this.prisma.roundDeliveryStop.update({
      where: { uq_round_delivery_stop: { roundId, pickupPointId } },
      data: { procurementCompletedAt: new Date() },
    });

    await this.deliveryStops.markStopInProgress(roundId, pickupPointId);

    const openProc = await this.prisma.roundDeliveryStop.count({
      where: {
        roundId,
        isProcurementStop: true,
        procurementCompletedAt: null,
      },
    });

    const result = await this.deliveryStops.releaseReadyOrdersToTransit(
      roundId,
      stop.sortOrder,
    );
    const ordersSentToTransit = result.ordersDispatched;

    return {
      ok: true,
      procurementStopsRemaining: openProc,
      ordersSentToTransit,
    };
  }
}
