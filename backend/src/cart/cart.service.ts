import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, RoundStatus, User } from '@prisma/client';
import {
  calcLineWeightKg,
  calcRoundProgressPercent,
  decimalToNumber,
  ORDER_STATUS_LABELS,
  roundWeightTotals,
} from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartItemDto } from './dto/cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async generatePublicNumber(): Promise<string> {
    const now = new Date();
    const prefix = `YKT-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.order.count({
      where: { publicNumber: { startsWith: `${prefix}-` } },
    });
    return `${prefix}-${String(count + 1).padStart(2, '0')}`;
  }

  private mapRound(
    round: {
      participantsCount: number;
      targetParticipants: number;
      currentWeightKg: { toNumber(): number };
      targetWeightKg: { toNumber(): number };
    } & Record<string, unknown>,
  ) {
    const { currentKg, targetKg } = roundWeightTotals(round);
    return {
      ...round,
      currentWeightKg: currentKg,
      targetWeightKg: targetKg,
      progressPercent: calcRoundProgressPercent(round),
    };
  }

  async getCart(user: User) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        round: { include: { route: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const round = items[0]?.round ?? null;
    const [settlement, pickupPoint] = await Promise.all([
      user.settlementId
        ? this.prisma.settlement.findUnique({ where: { id: user.settlementId } })
        : null,
      user.pickupPointId
        ? this.prisma.pickupPoint.findUnique({ where: { id: user.pickupPointId } })
        : null,
    ]);

    let totalEstimate = 0;
    const mappedItems = items.map((item) => {
      const price = decimalToNumber(item.product.priceEstimate);
      const lineTotal = price * item.quantity;
      totalEstimate += lineTotal;
      return {
        id: item.id,
        roundId: item.roundId,
        productId: item.productId,
        quantity: item.quantity,
        product: { ...item.product, priceEstimate: price },
        lineTotal,
      };
    });

    return {
      round: round ? this.mapRound(round) : null,
      settlement,
      pickupPoint,
      items: mappedItems,
      itemsCount: items.reduce((s, i) => s + i.quantity, 0),
      totalEstimate,
    };
  }

  private async resolveOpenRound(roundId?: string) {
    if (roundId) {
      const round = await this.prisma.round.findUnique({ where: { id: roundId } });
      if (!round) throw new NotFoundException('Сбор не найден');
      if (round.status !== RoundStatus.open) {
        throw new BadRequestException('Сбор закрыт');
      }
      return round;
    }
    const round = await this.prisma.round.findFirst({
      where: { status: RoundStatus.open },
      orderBy: { closesAt: 'asc' },
    });
    if (!round) throw new BadRequestException('Нет открытых сборов');
    return round;
  }

  async addItem(user: User, dto: CreateCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Товар не найден');

    const round = await this.resolveOpenRound(dto.roundId);
    const quantity = dto.quantity ?? 1;

    const existingRoundId = await this.prisma.cartItem.findFirst({
      where: { userId: user.id },
      select: { roundId: true },
    });
    if (existingRoundId && existingRoundId.roundId !== round.id) {
      throw new BadRequestException(
        'В корзине уже есть товары из другого сбора. Очистите корзину или завершите заказ.',
      );
    }

    await this.prisma.cartItem.upsert({
      where: {
        uq_cart_user_round_product: {
          userId: user.id,
          roundId: round.id,
          productId: product.id,
        },
      },
      create: {
        userId: user.id,
        roundId: round.id,
        productId: product.id,
        quantity,
      },
      update: { quantity: { increment: quantity } },
    });

    return this.getCart(user);
  }

  async updateItem(user: User, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
    });
    if (!item) throw new NotFoundException('Позиция не найдена');
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.getCart(user);
  }

  async removeItem(user: User, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
    });
    if (!item) throw new NotFoundException('Позиция не найдена');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(user);
  }

  async clear(user: User) {
    await this.prisma.cartItem.deleteMany({ where: { userId: user.id } });
    return this.getCart(user);
  }

  async checkout(user: User) {
    if (!user.pickupPointId) {
      throw new BadRequestException('Укажите пункт выдачи в профиле перед оформлением');
    }

    const items = await this.prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true, round: { include: { route: true } } },
    });
    if (!items.length) throw new BadRequestException('Корзина пуста');

    const roundIds = new Set(items.map((i) => i.roundId));
    if (roundIds.size > 1) {
      throw new BadRequestException('В корзине товары из разных сборов');
    }

    const round = items[0].round;
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор уже закрыт');
    }

    const existing = await this.prisma.order.findFirst({
      where: {
        userId: user.id,
        roundId: round.id,
        status: { not: OrderStatus.cancelled },
      },
    });
    if (existing) {
      throw new BadRequestException('Вы уже участвуете в этом сборе');
    }

    let totalEstimate = 0;
    let orderWeightKg = 0;
    const orderItemsData = items.map((item) => {
      const price = decimalToNumber(item.product.priceEstimate);
      const lineWeight = calcLineWeightKg(
        decimalToNumber(item.product.weightKg),
        item.quantity,
        item.product.unit,
      );
      totalEstimate += price * item.quantity;
      orderWeightKg += lineWeight;
      return {
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        priceSnapshot: item.product.priceEstimate,
      };
    });

    if (orderWeightKg <= 0) {
      throw new BadRequestException('Не удалось рассчитать вес заказа');
    }

    const { currentKg, targetKg } = roundWeightTotals(round);
    if (currentKg + orderWeightKg > targetKg + 0.001) {
      const left = Math.max(targetKg - currentKg, 0);
      throw new BadRequestException(
        `Превышен лимит сбора: доступно ещё ${left.toFixed(1)} кг`,
      );
    }

    const publicNumber = await this.generatePublicNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          publicNumber,
          userId: user.id,
          roundId: round.id,
          pickupPointId: user.pickupPointId,
          status: OrderStatus.submitted,
          totalEstimate,
          statusNote: ORDER_STATUS_LABELS.submitted,
          items: { create: orderItemsData },
        },
        include: { items: true, round: { include: { route: true } } },
      });
      await tx.cartItem.deleteMany({ where: { userId: user.id } });
      await tx.round.update({
        where: { id: round.id },
        data: {
          currentWeightKg: { increment: orderWeightKg },
          participantsCount: { increment: 1 },
        },
      });
      return created;
    });

    const title = order.round.title ?? order.round.route.title;
    return {
      id: order.id,
      publicNumber: order.publicNumber,
      roundId: order.roundId,
      status: order.status,
      totalEstimate: decimalToNumber(order.totalEstimate),
      statusNote: order.statusNote,
      expectedAt: order.expectedAt,
      createdAt: order.createdAt,
      title,
      items: order.items.map((i) => ({
        ...i,
        priceSnapshot: decimalToNumber(i.priceSnapshot),
      })),
    };
  }
}
