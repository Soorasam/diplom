import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RoundStatus, User } from '@prisma/client';
import {
  calcRoundProgressPercent,
  decimalToNumber,
  roundWeightTotals,
} from '../common/order-labels';
import { DeliveryStopsService } from '../logistics/delivery-stops.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoundDto } from './dto/create-round.dto';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private deliveryStops: DeliveryStopsService,
  ) {}

  async publicStats() {
    const [activeRounds, settlementsCount, participants] = await Promise.all([
      this.prisma.round.count({ where: { status: RoundStatus.open } }),
      this.prisma.settlement.count(),
      this.prisma.order.findMany({ select: { userId: true }, distinct: ['userId'] }),
    ]);
    const participantsCount = participants.length || (await this.prisma.user.count());
    return {
      active_rounds: activeRounds,
      settlements_count: settlementsCount,
      participants_count: participantsCount,
    };
  }

  listSettlements() {
    return this.prisma.settlement.findMany({ orderBy: { name: 'asc' } });
  }

  listPickupPoints(settlementId?: string) {
    return this.prisma.pickupPoint.findMany({
      where: settlementId ? { settlementId } : undefined,
      orderBy: { coordinatorName: 'asc' },
    });
  }

  listRoutes() {
    return this.prisma.route.findMany({ orderBy: { title: 'asc' } });
  }

  async createRound(dto: CreateRoundDto) {
    const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
    if (!route) throw new NotFoundException('Маршрут не найден');

    const round = await this.prisma.round.create({
      data: {
        routeId: dto.routeId,
        title: dto.title,
        closesAt: new Date(dto.closesAt),
        minParticipants: dto.minParticipants ?? 10,
        targetParticipants: dto.targetParticipants ?? 50,
        status: RoundStatus.open,
      },
      include: { route: true },
    });

    return this.enrichRound(round);
  }

  private enrichRound(round: {
    participantsCount: number;
    targetParticipants: number;
    currentWeightKg: { toNumber(): number };
    targetWeightKg: { toNumber(): number };
  } & Record<string, unknown>) {
    const { currentKg, targetKg } = roundWeightTotals(round);
    return {
      ...round,
      currentWeightKg: currentKg,
      targetWeightKg: targetKg,
      progressPercent: calcRoundProgressPercent(round),
    };
  }

  
  async joinRound(user: User, roundId: string) {
    const round = await this.prisma.round.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор закрыт для участия');
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
    const round = await this.prisma.round.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!round) throw new NotFoundException('Сбор не найден');
    return this.enrichRound(round);
  }

  async closeRound(id: string) {
    const round = await this.prisma.round.findUnique({ where: { id } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор уже закрыт');
    }
    const updated = await this.prisma.round.update({
      where: { id },
      data: { status: RoundStatus.closed },
      include: { route: true },
    });
    await this.deliveryStops.dispatchRound(id);
    return updated;
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
      include: { route: true },
    });
    return this.enrichRound(updated);
  }

  async listRounds(status?: RoundStatus) {
    const rounds = await this.prisma.round.findMany({
      where: status ? { status } : undefined,
      include: { route: true },
      orderBy: { createdAt: 'desc' },
    });
    return rounds.map((r) => this.enrichRound(r));
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
