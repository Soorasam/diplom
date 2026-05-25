import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStopStatus,
  OrderStatus,
  Prisma,
  RoundStatus,
  UserRole,
} from '@prisma/client';
import { ORDER_STATUS_LABELS } from '../common/order-labels';
import { assertOrderStatusTransition } from '../common/order-status-transitions';
import { CatalogService } from '../catalog/catalog.service';
import { DeliveryStopsService } from '../logistics/delivery-stops.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService,
    private deliveryStops: DeliveryStopsService,
    private catalog: CatalogService,
  ) {}

  private async requirePickupPoint(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { pickupPoint: true },
    });
    if (!user?.pickupPointId || !user.pickupPoint) {
      throw new ForbiddenException('Сотрудник не привязан к ПВЗ');
    }
    return { pickupPointId: user.pickupPointId, pickupPoint: user.pickupPoint };
  }

  async getWorkspace(userId: string) {
    await this.catalog.processDueEmergencyCloses();

    const { pickupPointId, pickupPoint } = await this.requirePickupPoint(userId);

    await this.syncStuckOrdersForPickupPoint(pickupPointId);

    const orders = await this.prisma.order.findMany({
      where: {
        pickupPointId,
        status: {
          in: [
            OrderStatus.submitted,
            OrderStatus.in_transit,
            OrderStatus.at_pickup,
            OrderStatus.confirmed,
          ],
        },
        round: { status: { in: [RoundStatus.closed, RoundStatus.fulfilled] } },
      },
      include: {
        user: { select: { fullName: true, phone: true } },
        round: { select: { id: true, title: true, status: true } },
        items: { include: { product: true } },
      },
      orderBy: [{ roundId: 'asc' }, { createdAt: 'asc' }],
    });

    const roundIds = [...new Set(orders.map((o) => o.roundId).filter(Boolean))] as string[];

    const stops =
      roundIds.length > 0
        ? await this.prisma.roundDeliveryStop.findMany({
            where: { roundId: { in: roundIds }, pickupPointId },
          })
        : [];

    const stopByRound = new Map(stops.map((s) => [s.roundId, s]));

    const intakeByRound = new Map<
      string,
      {
        roundId: string;
        roundTitle: string;
        stopStatus: DeliveryStopStatus;
        orders: typeof orders;
      }
    >();

    for (const order of orders) {
      if (!order.roundId || !order.round) continue;
      if (
        order.status !== OrderStatus.in_transit &&
        order.status !== OrderStatus.confirmed &&
        order.status !== OrderStatus.submitted
      ) {
        continue;
      }

      const existing = intakeByRound.get(order.roundId);
      if (existing) {
        existing.orders.push(order);
      } else {
        intakeByRound.set(order.roundId, {
          roundId: order.roundId,
          roundTitle: order.round.title ?? 'Сбор',
          stopStatus:
            stopByRound.get(order.roundId)?.status ?? DeliveryStopStatus.pending,
          orders: [order],
        });
      }
    }

    const intakeGroups = [...intakeByRound.values()].map((g) => {
      const roundAtPvz = orders.filter((o) => o.roundId === g.roundId);
      const pending = roundAtPvz.filter((o) => o.status === OrderStatus.in_transit).length;
      const received = roundAtPvz.filter(
        (o) =>
          o.status === OrderStatus.at_pickup || o.status === OrderStatus.delivered,
      ).length;
      const total = pending + received;
      return {
        roundId: g.roundId,
        roundTitle: g.roundTitle,
        stopStatus: g.stopStatus,
        progress: { total, received, pending },
        orders: g.orders,
      };
    });

    const handoutOrdersRaw = orders.filter((o) => o.status === OrderStatus.at_pickup);

    const inTransitCount = orders.filter((o) => o.status === OrderStatus.in_transit).length;
    const awaitingDispatchCount = orders.filter(
      (o) =>
        o.status === OrderStatus.confirmed &&
        o.round?.status === RoundStatus.closed,
    ).length;
    const atPickupCount = handoutOrdersRaw.length;

    const openRoundOrders = await this.prisma.order.count({
      where: {
        pickupPointId,
        status: { in: [OrderStatus.submitted, OrderStatus.confirmed] },
        round: { status: RoundStatus.open },
      },
    });

    const submittedOnClosedRound = await this.prisma.order.count({
      where: {
        pickupPointId,
        status: OrderStatus.submitted,
        round: { status: RoundStatus.closed },
      },
    });

    const hints: string[] = [];
    if (openRoundOrders > 0) {
      hints.push(
        `В открытых сборах — ${openRoundOrders} заказ(ов) на ваш ПВЗ. Они появятся здесь после закрытия сбора водителем (таймер или админ).`,
      );
    }
    if (submittedOnClosedRound > 0) {
      hints.push(
        `Сбор закрыт, но ${submittedOnClosedRound} заказ(ов) ещё не отправлены в рейс. Обновите страницу через несколько секунд.`,
      );
    }
    if (awaitingDispatchCount > 0) {
      hints.push(
        'Сбор закрыт, но заказы ещё не в пути. Админ: «Сборы» → «Закрыть и отправить рейс» (или повторный запуск доставки).',
      );
    }
    if (inTransitCount > 0 && intakeGroups.length === 0) {
      hints.push(
        `Ожидается ${inTransitCount} заказ(ов) «в пути» — обновите страницу или проверьте вкладку «Приём».`,
      );
    }
    if (
      inTransitCount === 0 &&
      atPickupCount === 0 &&
      intakeGroups.length === 0 &&
      openRoundOrders === 0 &&
      awaitingDispatchCount === 0
    ) {
      hints.push(
        'Нет активных заказов на ваш ПВЗ. Житель оформляет заказ в сборе с тем же пунктом выдачи, что указан в профиле.',
      );
    }

    return {
      pickupPoint: {
        id: pickupPoint.id,
        name: pickupPoint.name,
        address: pickupPoint.address,
        settlementName: pickupPoint.name,
      },
      intakeGroups: intakeGroups.map((g) => ({
        ...g,
        orders: g.orders.map((o) => ({
          ...this.mapOrder(o),
          canReceive: o.status === OrderStatus.in_transit,
        })),
      })),
      handoutOrders: handoutOrdersRaw.map((o) => this.mapOrder(o)),
      stats: {
        awaitingDriver: inTransitCount,
        awaitingDispatch: awaitingDispatchCount,
        readyForHandout: atPickupCount,
        openRoundOrders,
        activeRounds: intakeGroups.filter((g) => g.stopStatus !== DeliveryStopStatus.completed)
          .length,
      },
      hints,
    };
  }

  /** Заказы на закрытом сборе: submitted → confirmed; после закупки → in_transit. */
  private async syncStuckOrdersForPickupPoint(pickupPointId: string) {
    await this.prisma.order.updateMany({
      where: {
        pickupPointId,
        status: OrderStatus.submitted,
        round: { status: RoundStatus.closed },
      },
      data: {
        status: OrderStatus.confirmed,
        statusNote: ORDER_STATUS_LABELS.confirmed,
      },
    });

    const roundIds = await this.prisma.order.findMany({
      where: {
        pickupPointId,
        status: OrderStatus.confirmed,
        round: { status: RoundStatus.closed },
      },
      select: { roundId: true },
      distinct: ['roundId'],
    });

    for (const row of roundIds) {
      if (!row.roundId) continue;
      const openProc = await this.prisma.roundDeliveryStop.count({
        where: {
          roundId: row.roundId,
          isProcurementStop: true,
          procurementCompletedAt: null,
        },
      });
      if (openProc === 0) {
        await this.deliveryStops.releaseOrdersToTransit(row.roundId);
      }
    }
  }

  async receiveFromDriver(userId: string, orderId: string) {
    const { pickupPointId } = await this.requirePickupPoint(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { round: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.pickupPointId !== pickupPointId) {
      throw new ForbiddenException('Заказ относится к другому ПВЗ');
    }
    if (!order.roundId) {
      throw new BadRequestException('Заказ не привязан к сбору');
    }

    assertOrderStatusTransition(UserRole.employee, order.status, OrderStatus.at_pickup);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.at_pickup },
      include: {
        user: { select: { fullName: true, phone: true } },
        round: { select: { id: true, title: true } },
        items: { include: { product: true } },
      },
    });

    const completion = await this.deliveryStops.refreshStopCompletion(
      order.roundId,
      pickupPointId,
    );

    if (completion.roundCompleted) {
      await this.prisma.round.update({
        where: { id: order.roundId },
        data: { status: RoundStatus.fulfilled },
      });
    }

    const stop = await this.prisma.roundDeliveryStop.findUnique({
      where: {
        uq_round_delivery_stop: {
          roundId: order.roundId,
          pickupPointId,
        },
      },
    });

    return {
      order: this.mapOrder(updated),
      stopStatus: stop?.status ?? DeliveryStopStatus.in_progress,
      stopCompleted: completion.stopCompleted,
      roundDeliveryCompleted: completion.roundCompleted,
    };
  }

  async handoutToResident(userId: string, orderId: string) {
    const { pickupPointId } = await this.requirePickupPoint(userId);

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.pickupPointId !== pickupPointId) {
      throw new ForbiddenException('Заказ относится к другому ПВЗ');
    }

    assertOrderStatusTransition(UserRole.employee, order.status, OrderStatus.delivered);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.delivered },
      include: {
        user: { select: { fullName: true, phone: true } },
        round: { select: { id: true, title: true } },
        items: { include: { product: true } },
      },
    });

    if (order.roundId) {
      await this.deliveryStops.refreshStopCompletion(order.roundId, pickupPointId);
    }

    return { order: this.mapOrder(updated) };
  }

  private mapOrder(
    order: {
      id: string;
      publicNumber: string;
      status: OrderStatus;
      totalEstimate: Prisma.Decimal | number;
      roundId: string | null;
      round?: { id: string; title: string | null } | null;
      user: { fullName: string | null; phone: string | null };
      items: {
        productName: string;
        quantity: number;
        unit: string;
        product: { name: string; unit: string };
      }[];
    },
  ) {
    return {
      id: order.id,
      publicNumber: order.publicNumber,
      status: order.status,
      totalAmount: Number(order.totalEstimate),
      roundId: order.roundId,
      roundTitle: order.round?.title ?? null,
      customerName: order.user.fullName,
      customerPhone: order.user.phone,
      items: order.items.map((i) => ({
        name: i.productName || i.product.name,
        quantity: i.quantity,
        unit: i.unit || i.product.unit,
      })),
    };
  }
}
