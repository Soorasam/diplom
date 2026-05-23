import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStopStatus, OrderStatus, RoundStatus } from '@prisma/client';
import { calcRoundProgressPercent } from '../common/order-labels';
import { mapOrderDetail, OrderWithRelations } from '../common/order-mapper';
import {
  coordsForSettlementName,
  hubCoordsForRouteTitle,
} from '../common/settlement-coordinates';
import { DeliveryStopsService } from '../logistics/delivery-stops.service';
import { PrismaService } from '../prisma/prisma.service';

const orderInclude = {
  items: true,
  round: { include: { route: true } },
  user: { select: { id: true, fullName: true, phone: true, email: true } },
} as const;

@Injectable()
export class CoordinatorService {
  constructor(
    private prisma: PrismaService,
    private deliveryStops: DeliveryStopsService,
  ) {}

  async listRoutes() {
    const [routes, pickupPoints, orders, allStops] = await Promise.all([
      this.prisma.route.findMany({
        orderBy: { title: 'asc' },
        include: {
          rounds: {
            orderBy: { closesAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.pickupPoint.findMany({
        include: { settlement: true },
      }),
      this.prisma.order.findMany({
        where: {
          status: {
            notIn: [OrderStatus.cancelled, OrderStatus.delivered],
          },
          pickupPointId: { not: null },
        },
        include: {
          pickupPoint: { include: { settlement: true } },
          round: { select: { id: true, routeId: true, status: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.roundDeliveryStop.findMany({
        include: {
          pickupPoint: { include: { settlement: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const stopsByRound = new Map<string, typeof allStops>();
    for (const stop of allStops) {
      const list = stopsByRound.get(stop.roundId) ?? [];
      list.push(stop);
      stopsByRound.set(stop.roundId, list);
    }

    return routes.map((route) => {
      const latest = route.rounds[0];
      const transportType = route.transportType;
      const deliveryMode =
        transportType === 'river'
          ? 'river'
          : transportType === 'winter_road'
            ? 'winter_road'
            : 'mixed';

      const hub = hubCoordsForRouteTitle(route.title);
      let status: 'planned' | 'active' | 'completed' = 'planned';
      let deliveryStops: {
        pickupPointId: string;
        label: string;
        settlementName: string;
        status: 'pending' | 'in_progress' | 'completed';
        totalOrders: number;
        receivedOrders: number;
        inTransitOrders: number;
        coords: { lat: number; lng: number };
      }[] = [];

      if (latest && latest.status !== RoundStatus.open) {
        const roundOrders = orders.filter((o) => o.round?.id === latest.id);
        const stops = stopsByRound.get(latest.id) ?? [];

        deliveryStops = stops.map((s) => {
          const counts = this.deliveryStops.orderCountsForStop(
            roundOrders,
            s.pickupPointId,
          );
          return {
            pickupPointId: s.pickupPointId,
            label: s.pickupPoint.coordinatorName,
            settlementName: s.pickupPoint.settlement.name,
            status:
              s.status === DeliveryStopStatus.completed
                ? 'completed'
                : s.status === DeliveryStopStatus.in_progress
                  ? 'in_progress'
                  : 'pending',
            totalOrders: counts.total,
            receivedOrders: counts.received,
            inTransitOrders: counts.inTransit,
            coords: coordsForSettlementName(s.pickupPoint.settlement.name),
          };
        });

        const allStopsDone =
          stops.length > 0 &&
          stops.every((s) => s.status === DeliveryStopStatus.completed);
        const hasDelivery =
          roundOrders.some((o) => o.status === OrderStatus.in_transit) ||
          stops.some((s) => s.status !== DeliveryStopStatus.pending);

        if (latest.status === RoundStatus.fulfilled || allStopsDone) {
          status = 'completed';
        } else if (hasDelivery || latest.status === RoundStatus.closed) {
          status = 'active';
        }
      } else if (latest?.status === RoundStatus.open) {
        status = 'active';
      }

      const routeOrders = orders.filter((o) => o.round?.routeId === route.id);
      const seenSettlementIds = new Set<string>();
      const destinations: { id: string; name: string }[] = [];

      if (deliveryStops.length === 0) {
        for (const order of routeOrders) {
          const settlement = order.pickupPoint?.settlement;
          if (!settlement || seenSettlementIds.has(settlement.id)) continue;
          seenSettlementIds.add(settlement.id);
          destinations.push({ id: settlement.id, name: settlement.name });
        }

        if (destinations.length === 0) {
          for (const pp of pickupPoints) {
            if (seenSettlementIds.has(pp.settlementId)) continue;
            seenSettlementIds.add(pp.settlementId);
            destinations.push({
              id: pp.settlementId,
              name: pp.settlement.name,
            });
          }
        }
      }

      const points =
        deliveryStops.length > 0
          ? [hub, ...deliveryStops.map((s) => s.coords)]
          : [
              hub,
              ...destinations.map((d) => coordsForSettlementName(d.name)),
            ];

      return {
        id: route.id,
        name: route.title,
        fromSettlementId: '',
        toSettlementIds:
          deliveryStops.length > 0
            ? deliveryStops.map((s) => s.pickupPointId)
            : destinations.map((d) => d.id),
        deliveryMode,
        status,
        points,
        activeRoundId: latest?.id ?? null,
        hubLabel: route.title.split('→')[0]?.trim() || 'Пункт отправления',
        deliveryStops,
      };
    });
  }

  async startDelivery(roundId: string) {
    const round = await this.prisma.round.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status === RoundStatus.open) {
      throw new BadRequestException('Сначала закройте сбор');
    }
    if (round.status === RoundStatus.fulfilled) {
      throw new BadRequestException('Рейс уже завершён');
    }

    const result = await this.deliveryStops.dispatchRound(roundId);

    return {
      roundId,
      ordersSentToTransit: result.ordersDispatched,
    };
  }

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          notIn: [OrderStatus.cancelled, OrderStatus.delivered],
        },
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => {
      const base = mapOrderDetail(o as unknown as OrderWithRelations);
      const user = o.user;
      return {
        ...base,
        userName: user.fullName ?? user.email,
        userPhone: user.phone ?? '',
      };
    });
  }

  async dashboard() {
    const [routes, orders] = await Promise.all([
      this.listRoutes(),
      this.prisma.order.findMany({
        select: { status: true, totalEstimate: true },
      }),
    ]);

    const inTransit = orders.filter(
      (o) => o.status === OrderStatus.in_transit || o.status === OrderStatus.at_pickup,
    ).length;

    return {
      routes,
      ordersCount: orders.length,
      inTransitCount: inTransit,
    };
  }

  mapRound(round: {
    id: string;
    routeId: string;
    title: string | null;
    status: RoundStatus;
    closesAt: Date;
    minParticipants: number;
    targetParticipants: number;
    participantsCount: number;
    route: { title: string; transportType: string };
  }) {
    const transportType = round.route.transportType;
    const deliveryMode =
      transportType === 'river'
        ? 'river'
        : transportType === 'winter_road'
          ? 'winter_road'
          : 'mixed';

    const statusMap: Record<RoundStatus, string> = {
      open: 'open',
      closed: 'closed',
      fulfilled: 'shipped',
    };

    return {
      id: round.id,
      title: round.title ?? round.route.title,
      routeId: round.routeId,
      status: statusMap[round.status],
      closesAt: round.closesAt.toISOString(),
      minVolumePercent: Math.max(
        10,
        Math.round((round.minParticipants / Math.max(round.targetParticipants, 1)) * 100),
      ),
      currentVolumePercent: calcRoundProgressPercent(round),
      deliveryMode,
      estimatedDelivery: round.closesAt.toISOString(),
      totalEstimate: 0,
      progressPercent: calcRoundProgressPercent(round),
    };
  }
}
