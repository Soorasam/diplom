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
import { CheckoutCartDto, CreateCartItemDto } from './dto/cart-item.dto';

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
        round: { include: { waypoints: { include: { pickupPoint: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const round = items[0]?.round ?? null;
    const pickupPoint = user.pickupPointId
      ? await this.prisma.pickupPoint.findUnique({ where: { id: user.pickupPointId } })
      : null;

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
      settlement: pickupPoint,
      pickupPoint,
      items: mappedItems,
      itemsCount: items.reduce((s, i) => s + i.quantity, 0),
      totalEstimate,
    };
  }

  private async resolveOpenRound(roundId: string) {
    const round = await this.prisma.round.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Сбор не найден');
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор закрыт');
    }
    return round;
  }

  private async assertUserJoinedRound(userId: string, roundId: string) {
    const participant = await this.prisma.roundParticipant.findUnique({
      where: {
        uq_round_participant_user_round: { userId, roundId },
      },
    });
    if (!participant) {
      throw new BadRequestException('Сначала вступите в сбор');
    }
  }

  async addItem(user: User, dto: CreateCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Товар не найден');

    if (!dto.roundId) {
      throw new BadRequestException(
        'Укажите сбор: вступите в сбор на странице «Сборы» или выберите его в корзине',
      );
    }

    const round = await this.resolveOpenRound(dto.roundId);
    await this.assertUserJoinedRound(user.id, round.id);

    const quantity = dto.quantity ?? 1;

    await this.prisma.cartItem.upsert({
      where: {
        uq_cart_user_product: {
          userId: user.id,
          productId: product.id,
        },
      },
      create: {
        userId: user.id,
        roundId: round.id,
        productId: product.id,
        quantity,
      },
      update: {
        quantity: { increment: quantity },
        roundId: round.id,
      },
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

  async checkout(user: User, dto?: CheckoutCartDto) {
    if (!user.pickupPointId) {
      throw new BadRequestException('Укажите населённый пункт в профиле перед оформлением');
    }

    const items = await this.prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        round: { include: { waypoints: { include: { pickupPoint: true } } } },
      },
    });
    if (!items.length) throw new BadRequestException('Корзина пуста');

    if (!dto?.roundId) {
      throw new BadRequestException('Выберите сбор для оформления заказа');
    }
    const round = await this.prisma.round.findUnique({ where: { id: dto.roundId } });
    if (!round) {
      throw new BadRequestException('Сбор не найден');
    }
    if (round.status !== RoundStatus.open) {
      throw new BadRequestException('Сбор закрыт — новые заказы недоступны');
    }
    await this.assertUserJoinedRound(user.id, round.id);

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
      const existingParticipant = await tx.order.findFirst({
        where: {
          userId: user.id,
          roundId: round.id,
          status: { not: OrderStatus.cancelled },
        },
        select: { id: true },
      });
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
        include: {
          items: true,
          round: { include: { waypoints: { include: { pickupPoint: true } } } },
        },
      });
      await tx.cartItem.deleteMany({ where: { userId: user.id } });
      await tx.round.update({
        where: { id: round.id },
        data: {
          currentWeightKg: { increment: orderWeightKg },
          ...(existingParticipant ? {} : { participantsCount: { increment: 1 } }),
        },
      });
      return created;
    });

    const title =
      order.round.title ??
      order.round.routeTitle ??
      order.round.waypoints
        ?.sort((a, b) => a.sortOrder - b.sortOrder)
        .map((w) => w.pickupPoint.name)
        .join(' → ') ??
      'Сбор';
    return {
      id: order.id,
      publicNumber: order.publicNumber,
      roundId: order.roundId,
      status: order.status,
      paymentStatus: order.paymentStatus,
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
