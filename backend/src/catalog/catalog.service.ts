import { Injectable, NotFoundException } from '@nestjs/common';
import { RoundStatus } from '@prisma/client';
import { calcProgressPercent, decimalToNumber } from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

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

  async listRounds(status?: RoundStatus) {
    const rounds = await this.prisma.round.findMany({
      where: status ? { status } : undefined,
      include: { route: true },
      orderBy: { closesAt: 'asc' },
    });
    return rounds.map((r) => ({
      ...r,
      progressPercent: calcProgressPercent(r.participantsCount, r.targetParticipants),
    }));
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

  mapProduct(product: { priceEstimate: { toNumber(): number } } & Record<string, unknown>) {
    return {
      ...product,
      priceEstimate: decimalToNumber(product.priceEstimate),
    };
  }
}
