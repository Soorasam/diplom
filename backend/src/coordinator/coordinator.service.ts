import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DeliveryStopStatus,
  OrderStatus,
  Prisma,
  RoundStatus,
  User,
  UserRole,
} from '@prisma/client';
import { calcRoundProgressPercent } from '../common/order-labels';
import { mapOrderDetail, orderInclude } from '../common/order-mapper';
import {
  attachVirtualRoute,
  resolveRoundRouteTitle,
  roundWaypointsInclude,
} from '../common/round-mapper';
import {
  coordsForSettlementName,
  hubCoordsForRouteTitle,
} from '../common/settlement-coordinates';
import { CatalogService } from '../catalog/catalog.service';
import { DeliveryStopsService } from '../logistics/delivery-stops.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoordinatorService {
  constructor(
    private prisma: PrismaService,
    private deliveryStops: DeliveryStopsService,
    private catalog: CatalogService,
  ) {}

  async listRoutes(user: User) {
    await this.catalog.processDueEmergencyCloses();
    const roundWhere: Prisma.RoundWhereInput = {};
    if (user.role === UserRole.coordinator) {
      roundWhere.createdByUserId = user.id;
    }

    const [rounds, orders, allStops] = await Promise.all([
      this.prisma.round.findMany({
        where: roundWhere,
        orderBy: { createdAt: 'desc' },
        include: roundWaypointsInclude,
      }),
      this.prisma.order.findMany({
        where: {
          status: { not: OrderStatus.cancelled },
          pickupPointId: { not: null },
        },
        include: {
          pickupPoint: true,
          round: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.roundDeliveryStop.findMany({
        include: { pickupPoint: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const stopsByRound = new Map<string, typeof allStops>();
    for (const stop of allStops) {
      const list = stopsByRound.get(stop.roundId) ?? [];
      list.push(stop);
      stopsByRound.set(stop.roundId, list);
    }

    const mapped = rounds.map((round) => {
      const chainTitle = resolveRoundRouteTitle(round);
      const transportType = round.transportType;
      const deliveryMode =
        transportType === 'river'
          ? 'river'
          : transportType === 'winter_road'
            ? 'winter_road'
            : 'mixed';

      const hub =
        round.waypoints.length > 0
          ? coordsForSettlementName(round.waypoints[0].pickupPoint.name)
          : hubCoordsForRouteTitle(chainTitle);

      let status: 'planned' | 'active' | 'completed' = 'completed';
      let deliveryStops: {
        pickupPointId: string;
        label: string;
        settlementName: string;
        address: string;
        status: 'pending' | 'in_progress' | 'completed';
        totalOrders: number;
        receivedOrders: number;
        inTransitOrders: number;
        coords: { lat: number; lng: number };
      }[] = [];

      if (round.status === RoundStatus.open) {
        status = 'planned';
      } else {
        const roundOrders = orders.filter((o) => o.round?.id === round.id);
        const stops = stopsByRound.get(round.id) ?? [];

        deliveryStops = stops.map((s) => {
          const counts = this.deliveryStops.orderCountsForStop(
            roundOrders,
            s.pickupPointId,
          );
          const derivedStatus = this.deriveStopUiStatus(s, counts);
          const expectsOrders = counts.total > 0;
          const driverCanComplete =
            !expectsOrders &&
            s.status !== DeliveryStopStatus.completed &&
            (!s.isProcurementStop || Boolean(s.procurementCompletedAt));
          if (
            derivedStatus === 'completed' &&
            s.status !== DeliveryStopStatus.completed
          ) {
            void this.deliveryStops
              .refreshStopCompletion(round.id, s.pickupPointId)
              .then(async (result) => {
                if (result.roundCompleted) {
                  await this.prisma.round.update({
                    where: { id: round.id },
                    data: { status: RoundStatus.fulfilled },
                  });
                }
              });
          }
          const address = s.pickupPoint.address?.trim() || s.pickupPoint.name;
          return {
            pickupPointId: s.pickupPointId,
            label: s.pickupPoint.name,
            settlementName: s.pickupPoint.name,
            address,
            status: derivedStatus,
            totalOrders: counts.total,
            receivedOrders: counts.received,
            inTransitOrders: counts.inTransit,
            coords: coordsForSettlementName(s.pickupPoint.name),
            isProcurementStop: s.isProcurementStop,
            procurementCompleted: Boolean(s.procurementCompletedAt),
            expectsOrders,
            driverCanComplete,
          };
        });

        const allStopsDone =
          deliveryStops.length > 0 &&
          deliveryStops.every((s) => s.status === 'completed');
        const hasDelivery =
          roundOrders.some((o) => o.status === OrderStatus.in_transit) ||
          stops.some((s) => s.status !== DeliveryStopStatus.pending);

        if (round.status === RoundStatus.fulfilled || allStopsDone) {
          status = 'completed';
        } else if (hasDelivery || round.status === RoundStatus.closed) {
          status = 'active';
        } else {
          status = 'completed';
        }
      }

      const roundOrders = orders.filter((o) => o.round?.id === round.id);
      const seenSettlementIds = new Set<string>();
      const destinations: { id: string; name: string }[] = [];

      if (deliveryStops.length === 0) {
        for (const order of roundOrders) {
          const pp = order.pickupPoint;
          if (!pp || seenSettlementIds.has(pp.id)) continue;
          seenSettlementIds.add(pp.id);
          destinations.push({ id: pp.id, name: pp.name });
        }
      }

      const waypointCoords = round.waypoints.map((w) =>
        coordsForSettlementName(w.pickupPoint.name),
      );

      const points =
        deliveryStops.length > 0
          ? waypointCoords.length > 0
            ? waypointCoords
            : [hub, ...deliveryStops.map((s) => s.coords)]
          : waypointCoords.length > 0
            ? waypointCoords
            : [hub, ...destinations.map((d) => coordsForSettlementName(d.name))];

      return {
        id: round.id,
        name: chainTitle,
        fromSettlementId: '',
        toSettlementIds:
          deliveryStops.length > 0
            ? deliveryStops.map((s) => s.pickupPointId)
            : destinations.map((d) => d.id),
        deliveryMode,
        status,
        points,
        activeRoundId: round.id,
        hubLabel:
          round.waypoints[0]?.pickupPoint.name ??
          chainTitle.split('→')[0]?.trim() ??
          'Пункт отправления',
        deliveryStops,
      };
    });

    return mapped.filter((route) => this.isRouteVisibleToDriver(route));
  }

  private isRouteVisibleToDriver(route: {
    status: 'planned' | 'active' | 'completed';
    activeRoundId?: string | null;
  }): boolean {
    if (route.status === 'completed') return false;
    if (route.status === 'active') return true;
    return route.status === 'planned' && Boolean(route.activeRoundId);
  }

  async completeRouteStop(user: User, roundId: string, pickupPointId: string) {
    const round = await this.prisma.round.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (
      user.role === UserRole.coordinator &&
      round.createdByUserId !== user.id
    ) {
      throw new BadRequestException('Нет доступа к этому сбору');
    }

    const result = await this.deliveryStops.completeStopByDriver(
      roundId,
      pickupPointId,
    );

    if (result.roundCompleted) {
      await this.prisma.round.update({
        where: { id: roundId },
        data: { status: RoundStatus.fulfilled },
      });
    }

    return result;
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

    const openProc = await this.prisma.roundDeliveryStop.count({
      where: {
        roundId,
        isProcurementStop: true,
        procurementCompletedAt: null,
      },
    });

    const result =
      openProc === 0
        ? await this.deliveryStops.releaseOrdersToTransit(roundId)
        : { ordersDispatched: 0 };

    return {
      roundId,
      ordersSentToTransit: result.ordersDispatched,
      awaitingProcurement: openProc > 0,
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
      const base = mapOrderDetail(o);
      const user = o.user;
      return {
        ...base,
        userName: user.fullName ?? user.email,
        userPhone: user.phone ?? '',
      };
    });
  }

  async dashboard(user: User) {
    const [routes, orders] = await Promise.all([
      this.listRoutes(user),
      this.prisma.order.findMany({
        select: { status: true, totalEstimate: true },
      }),
    ]);

    const inTransit = orders.filter(
      (o) => o.status === OrderStatus.in_transit || o.status === OrderStatus.at_pickup,
    ).length;

    return {
      routes_count: routes.length,
      orders_in_transit: inTransit,
      orders_total: orders.length,
    };
  }

  private deriveStopUiStatus(
    stop: {
      status: DeliveryStopStatus;
      isProcurementStop: boolean;
      procurementCompletedAt: Date | null;
    },
    counts: { total: number; received: number; inTransit: number },
  ): 'pending' | 'in_progress' | 'completed' {
    if (stop.status === DeliveryStopStatus.completed) return 'completed';

    if (counts.total > 0) {
      if (counts.received === counts.total) return 'completed';
      if (counts.inTransit > 0 || counts.received > 0) return 'in_progress';
      if (stop.status === DeliveryStopStatus.in_progress) return 'in_progress';
      return 'pending';
    }

    if (stop.isProcurementStop && !stop.procurementCompletedAt) return 'pending';
    if (stop.isProcurementStop && stop.procurementCompletedAt) return 'completed';

    if (stop.status === DeliveryStopStatus.in_progress) return 'in_progress';
    return 'pending';
  }

  mapRound(round: {
    id: string;
    routeId?: string;
    title: string | null;
    routeTitle?: string | null;
    transportType: string;
    status: RoundStatus;
    closesAt: Date;
    minParticipants: number;
    targetParticipants: number;
    participantsCount: number;
    waypoints?: { pickupPoint: { name: string }; sortOrder: number }[];
  }) {
    const withRoute = attachVirtualRoute(
      round as Parameters<typeof attachVirtualRoute>[0],
    );
    const transportType = withRoute.transportType;
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
      id: withRoute.id,
      title: withRoute.title ?? withRoute.route.title,
      routeId: withRoute.id,
      status: statusMap[withRoute.status],
      closesAt: withRoute.closesAt.toISOString(),
      minVolumePercent: Math.max(
        10,
        Math.round(
          (withRoute.minParticipants / Math.max(withRoute.targetParticipants, 1)) *
            100,
        ),
      ),
      currentVolumePercent: calcRoundProgressPercent(withRoute),
      deliveryMode,
      estimatedDelivery: withRoute.closesAt.toISOString(),
      totalEstimate: 0,
      progressPercent: calcRoundProgressPercent(withRoute),
    };
  }
}
