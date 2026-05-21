import { Injectable } from '@nestjs/common';
import { OrderStatus, RoundStatus } from '@prisma/client';
import { calcRoundProgressPercent } from '../common/order-labels';
import { mapOrderDetail, OrderWithRelations } from '../common/order-mapper';
import {
  coordsForSettlementName,
  hubCoordsForRouteTitle,
} from '../common/settlement-coordinates';
import { PrismaService } from '../prisma/prisma.service';

const orderInclude = {
  items: true,
  round: { include: { route: true } },
  user: { select: { id: true, fullName: true, phone: true, email: true } },
} as const;

@Injectable()
export class CoordinatorService {
  constructor(private prisma: PrismaService) {}

  async listRoutes() {
    const [routes, pickupPoints, orders] = await Promise.all([
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
          round: { select: { routeId: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return routes.map((route) => {
      const latest = route.rounds[0];
      let status: 'planned' | 'active' | 'completed' = 'planned';
      if (latest) {
        if (latest.status === RoundStatus.open) status = 'active';
        else if (latest.status === RoundStatus.fulfilled) status = 'completed';
        else status = 'active';
      }

      const transportType = route.transportType;
      const deliveryMode =
        transportType === 'river'
          ? 'river'
          : transportType === 'winter_road'
            ? 'winter_road'
            : 'mixed';

      const routeOrders = orders.filter((o) => o.round?.routeId === route.id);
      const seenSettlementIds = new Set<string>();
      const destinations: { id: string; name: string }[] = [];

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

      const hub = hubCoordsForRouteTitle(route.title);
      const points = [
        hub,
        ...destinations.map((d) => coordsForSettlementName(d.name)),
      ];

      return {
        id: route.id,
        name: route.title,
        fromSettlementId: '',
        toSettlementIds: destinations.map((d) => d.id),
        deliveryMode,
        status,
        points,
        activeRoundId: latest?.id ?? null,
      };
    });
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
