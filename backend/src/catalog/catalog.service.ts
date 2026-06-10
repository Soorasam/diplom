import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStopStatus,
  DriverApplicationStatus,
  OrderStatus,
  PaymentStatus,
  RoundStatus,
  User,
  UserRole,
} from '@prisma/client';
import {
  calcRoundProgressPercent,
  decimalToNumber,
  roundWeightTotals,
} from '../common/order-labels';
import { DeliveryStopsService } from '../logistics/delivery-stops.service';
import { ProcurementChecklistService } from '../logistics/procurement-checklist.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  attachVirtualRoute,
  buildRouteTitleFromWaypoints,
  roundWaypointsInclude,
} from '../common/round-mapper';
import { RoutesService } from '../routes/routes.service';
import { CreateRoutePlanDto } from '../routes/dto/create-route-plan.dto';
import { CreateRoundDto } from './dto/create-round.dto';

const EMERGENCY_CLOSE_MS = 5 * 60 * 1000;

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private deliveryStops: DeliveryStopsService,
    private procurementChecklist: ProcurementChecklistService,
    private routesService: RoutesService,
  ) {}

  async processDueEmergencyCloses() {
    const due = await this.prisma.round.findMany({
      where: {
        status: RoundStatus.open,
        OR: [
          { emergencyCloseAt: { lte: new Date() } },
          {
            emergencyCloseAt: null,
            closesAt: { lte: new Date() },
          },
        ],
      },
      select: { id: true },
    });
    for (const row of due) {
      await this.closeRound(row.id);
    }
  }

  private async assertDriverCanManageRound(user: User, roundId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: roundWaypointsInclude,
    });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (user.role === UserRole.admin) return round;
    if (
      user.role !== UserRole.coordinator ||
      round.createdByUserId !== user.id
    ) {
      throw new ForbiddenException('Нет доступа к этому сбору');
    }
    return round;
  }

  private async assertDriverHasNoOpenRound(userId: string) {
    const openCount = await this.prisma.round.count({
      where: {
        status: RoundStatus.open,
        createdByUserId: userId,
      },
    });
    if (openCount > 0) {
      throw new BadRequestException(
        'У вас уже есть активный сбор. Сначала закройте текущий.',
      );
    }
  }

  private async assertDriverHasNoIncompleteDelivery(userId: string) {
    const round = await this.prisma.round.findFirst({
      where: {
        createdByUserId: userId,
        status: RoundStatus.closed,
        orders: {
          some: {
            status: { notIn: [OrderStatus.cancelled, OrderStatus.delivered] },
          },
        },
      },
      include: {
        deliveryStops: true,
        orders: {
          where: {
            status: { notIn: [OrderStatus.cancelled, OrderStatus.delivered] },
          },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!round || round.orders.length === 0) return;

    const hasOpenStops = round.deliveryStops.some(
      (s) => s.status !== DeliveryStopStatus.completed,
    );
    const hasOpenProcurement = round.deliveryStops.some(
      (s) => s.isProcurementStop && !s.procurementCompletedAt,
    );
    const hasInTransit = round.orders.some(
      (o) =>
        o.status === OrderStatus.in_transit ||
        o.status === OrderStatus.at_pickup,
    );

    if (hasOpenProcurement || hasOpenStops || hasInTransit) {
      throw new BadRequestException(
        'Сначала завершите текущий сбор: закупка, маршрут или выдача заказов жителям.',
      );
    }
  }

  async publicStats() {
    const [activeRounds, settlementsCount, participants] = await Promise.all([
      this.prisma.round.count({ where: { status: RoundStatus.open } }),
      this.prisma.pickupPoint.count(),
      this.prisma.order.findMany({ select: { userId: true }, distinct: ['userId'] }),
    ]);
    const participantsCount = participants.length || (await this.prisma.user.count());
    return {
      active_rounds: activeRounds,
      settlements_count: settlementsCount,
      locations_count: settlementsCount,
      participants_count: participantsCount,
    };
  }

  listSettlements() {
    return this.prisma.pickupPoint.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        district: true,
        ulus: true,
        address: true,
        phone: true,
      },
    });
  }

  listPickupPoints() {
    return this.listSettlements();
  }

  listRoutes() {
    return this.prisma.round.findMany({
      where: { status: RoundStatus.open },
      orderBy: { createdAt: 'desc' },
      include: roundWaypointsInclude,
    }).then((rows) => rows.map((r) => attachVirtualRoute(r)));
  }

  private async buildRouteTitle(plan: CreateRoutePlanDto): Promise<string> {
    if (plan.title?.trim()) return plan.title.trim();
    const points = await this.prisma.pickupPoint.findMany({
      where: { id: { in: plan.waypoints.map((w) => w.pickupPointId) } },
    });
    const byId = new Map(points.map((p) => [p.id, p.name]));
    const sorted = [...plan.waypoints].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.map((w) => byId.get(w.pickupPointId) ?? '?').join(' → ');
  }

  async createRound(user: User, dto: CreateRoundDto) {
    await this.processDueEmergencyCloses();
    if (user.role === UserRole.coordinator) {
      await this.assertDriverHasNoOpenRound(user.id);
      await this.assertDriverHasNoIncompleteDelivery(user.id);
    }

    let plan: CreateRoutePlanDto;
    if (dto.templateRouteId) {
      plan = await this.routesService.resolveRoutePlanFromTemplate(
        dto.templateRouteId,
        user.id,
      );
    } else if (dto.routePlan) {
      plan = { ...dto.routePlan };
      if (dto.routePlan.isTemplate) {
        await this.routesService.createTemplate(user, plan);
      }
    } else {
      throw new BadRequestException('Укажите маршрут или шаблон маршрута');
    }

    this.routesService.validateWaypoints(plan.waypoints);

    const closesAt = new Date(dto.closesAt);
    if (Number.isNaN(closesAt.getTime())) {
      throw new BadRequestException('Выберите корректную дату');
    }
    const maxClosesAt = new Date();
    maxClosesAt.setFullYear(maxClosesAt.getFullYear() + 2);
    maxClosesAt.setHours(23, 59, 59, 999);
    if (closesAt.getTime() <= Date.now() || closesAt.getTime() > maxClosesAt.getTime()) {
      throw new BadRequestException('Выберите корректную дату');
    }

    const routeTitle = await this.buildRouteTitle(plan);

    const round = await this.prisma.round.create({
      data: {
        title: dto.title,
        routeTitle,
        transportType: plan.transportType,
        createdByUserId: user.id,
        closesAt,
        minParticipants: dto.minParticipants ?? 1,
        targetParticipants: dto.targetParticipants ?? 15,
        status: RoundStatus.open,
        waypoints: {
          create: plan.waypoints.map((w) => ({
            pickupPointId: w.pickupPointId,
            sortOrder: w.sortOrder,
            isProcurementPoint: w.isProcurementPoint,
          })),
        },
      },
      include: roundWaypointsInclude,
    });

    return this.enrichRound(attachVirtualRoute(round));
  }

  private enrichRound(
    round: {
      participantsCount: number;
      targetParticipants: number;
      currentWeightKg: { toNumber(): number };
      targetWeightKg: { toNumber(): number };
      _count?: { orders: number };
      waypoints?: { pickupPoint: { name: string }; sortOrder: number }[];
    } & Record<string, unknown>,
  ) {
    const { currentKg, targetKg } = roundWeightTotals(round);
    const { _count, ...rest } = round;
    const routeChainTitle = round.waypoints?.length
      ? buildRouteTitleFromWaypoints(round.waypoints)
      : null;
    return {
      ...rest,
      currentWeightKg: currentKg,
      targetWeightKg: targetKg,
      progressPercent: calcRoundProgressPercent(round),
      activeOrdersCount: _count?.orders ?? undefined,
      routeChainTitle,
    };
  }

  private async loadCoordinatorMap(userIds: Array<string | null | undefined>) {
    const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
    if (!ids.length) return new Map<string, { fullName: string | null; phone: string | null; vehicleSummary: string | null }>();

    const [users, applications] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, fullName: true, phone: true },
      }),
      this.prisma.driverApplication.findMany({
        where: { userId: { in: ids }, status: DriverApplicationStatus.approved },
        select: { userId: true, vehicleSummary: true },
        orderBy: { reviewedAt: 'desc' },
      }),
    ]);

    const vehicleByUser = new Map<string, string | null>();
    for (const app of applications) {
      if (!vehicleByUser.has(app.userId)) {
        vehicleByUser.set(app.userId, app.vehicleSummary);
      }
    }

    return new Map(
      users.map((user) => [
        user.id,
        {
          fullName: user.fullName,
          phone: user.phone,
          vehicleSummary: vehicleByUser.get(user.id) ?? null,
        },
      ]),
    );
  }

  private attachDriverInfo<T extends Record<string, unknown>>(
    round: T,
    driver?: { fullName: string | null; phone: string | null; vehicleSummary: string | null },
  ) {
    if (!driver) return round;
    return {
      ...round,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      vehicleSummary: driver.vehicleSummary,
    };
  }

  private async enrichRoundsForResidents(rounds: Array<Record<string, unknown>>) {
    const driverMap = await this.loadCoordinatorMap(
      rounds.map((round) => round.createdByUserId as string | null | undefined),
    );
    return rounds.map((round) =>
      this.attachDriverInfo(
        round,
        driverMap.get(round.createdByUserId as string) ?? undefined,
      ),
    );
  }

  
  async leaveRound(user: User, roundId: string) {
    const participant = await this.prisma.roundParticipant.findUnique({
      where: {
        uq_round_participant_user_round: { userId: user.id, roundId },
      },
    });
    if (!participant) {
      throw new BadRequestException('Вы не состоите в этом сборе');
    }

    const ordersCount = await this.prisma.order.count({
      where: { userId: user.id, roundId },
    });
    if (ordersCount > 0) {
      throw new BadRequestException(
        'Выйти нельзя: по этому сбору уже оформлен заказ.',
      );
    }

    await this.prisma.roundParticipant.delete({
      where: { id: participant.id },
    });

    return {
      roundId,
      roundIds: await this.listUserRoundIds(user.id),
    };
  }

  async joinRound(user: User, roundId: string) {
    await this.processDueEmergencyCloses();
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: roundWaypointsInclude,
    });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор закрыт для участия');
    }
    if (round.createdByUserId === user.id) {
      throw new BadRequestException(
        'Нельзя участвовать в сборе, который вы организовали как водитель',
      );
    }
    if (!user.pickupPointId) {
      throw new BadRequestException(
        'Укажите населённый пункт доставки в профиле',
      );
    }
    const onRoute = round.waypoints.some(
      (w) => w.pickupPointId === user.pickupPointId,
    );
    if (!onRoute) {
      throw new BadRequestException(
        'Этот сбор не проходит через ваш населённый пункт',
      );
    }
    const { currentKg, targetKg } = roundWeightTotals(round);
    if (currentKg >= targetKg) {
      throw new BadRequestException('Достигнут лимит веса сбора');
    }

    await this.prisma.roundParticipant.upsert({
      where: {
        uq_round_participant_user_round: { userId: user.id, roundId },
      },
      create: { userId: user.id, roundId },
      update: {},
    });

    return {
      roundId,
      roundIds: await this.listUserRoundIds(user.id),
    };
  }

  
  async listUserRoundIds(userId: string) {
    const rows = await this.prisma.roundParticipant.findMany({
      where: { userId },
      select: { roundId: true },
      orderBy: { joinedAt: 'desc' },
    });
    return rows.map((r) => r.roundId);
  }

  async assertUserJoinedRound(userId: string, roundId: string) {
    const participant = await this.prisma.roundParticipant.findUnique({
      where: {
        uq_round_participant_user_round: { userId, roundId },
      },
    });
    if (!participant) {
      throw new BadRequestException('Сначала вступите в сбор');
    }
  }

  async getRound(id: string) {
    await this.processDueEmergencyCloses();
    const round = await this.prisma.round.findUnique({
      where: { id },
      include: roundWaypointsInclude,
    });
    if (!round) throw new NotFoundException('Сбор не найден');
    const enriched = this.enrichRound(attachVirtualRoute(round));
    const [withCoordinator] = await this.enrichRoundsForResidents([enriched]);

    if (round.status === RoundStatus.open) {
      return withCoordinator;
    }

    const stops = await this.prisma.roundDeliveryStop.findMany({
      where: { roundId: id },
      include: { pickupPoint: true },
      orderBy: { sortOrder: 'asc' },
    });

    const routeProgress = stops.map((s) => ({
      pickupPointId: s.pickupPointId,
      label: s.pickupPoint.name,
      status:
        s.status === DeliveryStopStatus.completed
          ? 'completed'
          : s.status === DeliveryStopStatus.in_progress
            ? 'in_progress'
            : 'pending',
      isProcurementStop: s.isProcurementStop,
    }));

    return { ...withCoordinator, routeProgress };
  }

  async getDriverActiveRound(user: User) {
    await this.processDueEmergencyCloses();
    const round = await this.prisma.round.findFirst({
      where: {
        status: RoundStatus.open,
        createdByUserId: user.id,
      },
      include: roundWaypointsInclude,
      orderBy: { createdAt: 'desc' },
    });
    return round ? this.enrichRound(attachVirtualRoute(round)) : null;
  }

  async getDriverDeliveryRound(user: User) {
    await this.processDueEmergencyCloses();
    await this.deliveryStops.fulfillSupersededRounds(user.id);

    const latestClosed = await this.prisma.round.findFirst({
      where: {
        createdByUserId: user.id,
        status: RoundStatus.closed,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (latestClosed) {
      await this.deliveryStops.repairRoundIfWorkComplete(latestClosed.id);
    }

    const round = await this.prisma.round.findFirst({
      where: {
        createdByUserId: user.id,
        status: RoundStatus.closed,
        OR: [
          {
            orders: {
              some: {
                status: {
                  notIn: [OrderStatus.cancelled, OrderStatus.delivered],
                },
              },
            },
          },
          {
            deliveryStops: {
              some: { status: { not: DeliveryStopStatus.completed } },
            },
          },
        ],
      },
      include: roundWaypointsInclude,
      orderBy: { createdAt: 'desc' },
    });
    return round ? this.enrichRound(attachVirtualRoute(round)) : null;
  }

  async scheduleEmergencyClose(user: User, id: string) {
    await this.processDueEmergencyCloses();
    const round = await this.assertDriverCanManageRound(user, id);
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор уже закрыт');
    }
    if (round.emergencyCloseAt) {
      throw new BadRequestException('Закрытие сбора уже запланировано');
    }
    const emergencyCloseAt = new Date(Date.now() + EMERGENCY_CLOSE_MS);
    const updated = await this.prisma.round.update({
      where: { id },
      data: { emergencyCloseAt },
      include: roundWaypointsInclude,
    });
    return this.enrichRound(attachVirtualRoute(updated));
  }

  async closeRound(id: string) {
    const round = await this.prisma.round.findUnique({ where: { id } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор уже закрыт');
    }

    const updated = await this.prisma.round.update({
      where: { id },
      data: { status: RoundStatus.closed, emergencyCloseAt: null },
      include: roundWaypointsInclude,
    });

    await this.cancelUnpaidOrders(id);

    const activeOrders = await this.prisma.order.count({
      where: {
        roundId: id,
        status: { notIn: [OrderStatus.cancelled, OrderStatus.delivered] },
      },
    });
    if (activeOrders === 0) {
      return attachVirtualRoute(updated);
    }

    await this.deliveryStops.dispatchRound(id);
    await this.procurementChecklist.initForRound(id);
    const procCount = await this.prisma.roundWaypoint.count({
      where: { roundId: id, isProcurementPoint: true },
    });
    if (procCount === 0) {
      await this.deliveryStops.releaseOrdersToTransit(id);
    }
    return attachVirtualRoute(updated);
  }

  private async cancelUnpaidOrders(roundId: string) {
    await this.prisma.order.updateMany({
      where: {
        roundId,
        paymentStatus: PaymentStatus.pending,
        status: { notIn: [OrderStatus.cancelled, OrderStatus.delivered] },
      },
      data: {
        status: OrderStatus.cancelled,
        statusNote: 'Заказ отменён: оплата не поступила до закрытия сбора',
      },
    });
  }

  async fulfillRound(id: string) {
    const round = await this.prisma.round.findUnique({ where: { id } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status === RoundStatus.open) {
      throw new BadRequestException('Сначала закройте сбор');
    }
    if (round.status === RoundStatus.fulfilled) {
      throw new BadRequestException('Приемка уже подтверждена');
    }
    const updated = await this.prisma.round.update({
      where: { id },
      data: { status: RoundStatus.fulfilled },
      include: roundWaypointsInclude,
    });
    return this.enrichRound(attachVirtualRoute(updated));
  }

  async listRounds(status?: RoundStatus) {
    await this.processDueEmergencyCloses();
    const rounds = await this.prisma.round.findMany({
      where: status ? { status } : undefined,
      include: {
        ...roundWaypointsInclude,
        _count: {
          select: {
            orders: {
              where: {
                status: {
                  notIn: [OrderStatus.cancelled, OrderStatus.delivered],
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const enriched = rounds.map((r) => this.enrichRound(attachVirtualRoute(r)));
    return this.enrichRoundsForResidents(enriched);
  }

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  listProducts(categoryId?: string) {
    return this.prisma.product.findMany({
      where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
    });
    if (!product) throw new NotFoundException('Товар не найден');
    return product;
  }

  mapProduct(
    product: {
      priceEstimate: { toNumber(): number };
      weightKg?: { toNumber(): number };
    } & Record<string, unknown>,
  ) {
    return {
      ...product,
      priceEstimate: decimalToNumber(product.priceEstimate),
      weightKg: decimalToNumber(product.weightKg),
    };
  }
}
