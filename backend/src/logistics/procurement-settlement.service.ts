import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  RoundStatus,
  User,
  UserRole,
} from '@prisma/client';
import { decimalToNumber } from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@Injectable()
export class ProcurementSettlementService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private async assertRoundAccess(user: User, roundId: string) {
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

  async listReceipts(user: User, roundId: string) {
    await this.assertRoundAccess(user, roundId);
    return this.prisma.roundProcurementReceipt.findMany({
      where: { roundId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        url: true,
        createdAt: true,
      },
    });
  }

  async uploadReceipt(user: User, roundId: string, file: UploadFile) {
    await this.assertRoundAccess(user, roundId);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Файл не передан');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Допустимы только изображения (фото чека)');
    }

    const bucket = this.storage.receiptsBucket();
    const key = `rounds/${roundId}/${Date.now()}-${file.originalname.replace(/[^\w.\-]+/g, '_')}`;
    const url = await this.storage.upload(bucket, key, file.buffer, file.mimetype);

    return this.prisma.roundProcurementReceipt.create({
      data: {
        roundId,
        objectKey: key,
        fileName: file.originalname,
        mimeType: file.mimetype,
        url,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        url: true,
        createdAt: true,
      },
    });
  }

  async getSettlement(user: User, roundId: string) {
    const round = await this.assertRoundAccess(user, roundId);
    const [receiptCount, orders] = await Promise.all([
      this.prisma.roundProcurementReceipt.count({ where: { roundId } }),
      this.prisma.order.findMany({
        where: {
          roundId,
          status: { not: OrderStatus.cancelled },
          paymentStatus: PaymentStatus.held,
        },
        select: {
          id: true,
          publicNumber: true,
          totalEstimate: true,
          refundAmount: true,
        },
      }),
    ]);

    const reservedTotal = orders.reduce(
      (sum, o) => sum + decimalToNumber(o.totalEstimate),
      0,
    );
    const refundTotal = orders.reduce(
      (sum, o) => sum + decimalToNumber(o.refundAmount),
      0,
    );

    return {
      roundId,
      receiptCount,
      reservedTotal,
      refundTotal,
      netTotal: Math.max(reservedTotal - refundTotal, 0),
      actualPurchaseTotal: round.actualPurchaseTotal
        ? decimalToNumber(round.actualPurchaseTotal)
        : null,
      purchaseSettledAt: round.purchaseSettledAt?.toISOString() ?? null,
      orders: orders.map((o) => ({
        id: o.id,
        publicNumber: o.publicNumber,
        totalEstimate: decimalToNumber(o.totalEstimate),
        refundAmount: decimalToNumber(o.refundAmount),
        netHeld: decimalToNumber(o.totalEstimate) - decimalToNumber(o.refundAmount),
      })),
    };
  }

  async settlePurchase(user: User, roundId: string, actualTotal: number) {
    const round = await this.assertRoundAccess(user, roundId);
    if (round.purchaseSettledAt) {
      throw new BadRequestException('Сверка по этому сбору уже выполнена');
    }

    const receiptCount = await this.prisma.roundProcurementReceipt.count({
      where: { roundId },
    });
    if (receiptCount === 0) {
      throw new BadRequestException('Прикрепите хотя бы одно фото чека');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        roundId,
        status: { not: OrderStatus.cancelled },
        paymentStatus: PaymentStatus.held,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (orders.length === 0) {
      throw new BadRequestException('Нет оплаченных заказов для сверки');
    }

    const reservedTotal = orders.reduce(
      (sum, o) => sum + decimalToNumber(o.totalEstimate),
      0,
    );
    if (actualTotal > reservedTotal + 0.001) {
      throw new BadRequestException(
        `Фактическая сумма (${actualTotal} ₽) больше зарезервированной (${reservedTotal.toFixed(2)} ₽)`,
      );
    }

    const totalRefund = Math.max(reservedTotal - actualTotal, 0);
    const allocations = this.allocateProportional(
      orders.map((o) => ({
        id: o.id,
        weight: decimalToNumber(o.totalEstimate),
        userId: o.userId,
        publicNumber: o.publicNumber,
      })),
      totalRefund,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.round.update({
        where: { id: roundId },
        data: {
          actualPurchaseTotal: actualTotal,
          purchaseSettledAt: new Date(),
        },
      });

      for (const row of allocations) {
        await tx.order.update({
          where: { id: row.id },
          data: {
            refundAmount: row.refundAmount,
            ...(row.refundAmount > 0
              ? {
                  statusNote: `Возврат переплаты после закупа: ${row.refundAmount.toFixed(2)} ₽`,
                }
              : {}),
          },
        });
      }
    });

    for (const row of allocations) {
      if (row.refundAmount <= 0) continue;
      await this.prisma.notification.create({
        data: {
          userId: row.userId,
          title: 'Возврат переплаты',
          body: `По заказу ${row.publicNumber} после сверки с чеками возвращено ${row.refundAmount.toFixed(2)} ₽ (эскроу).`,
        },
      });
    }

    return this.getSettlement(user, roundId);
  }

  private allocateProportional(
    orders: { id: string; weight: number; userId: string; publicNumber: string }[],
    totalRefund: number,
  ) {
    if (totalRefund <= 0) {
      return orders.map((o) => ({ ...o, refundAmount: 0 }));
    }

    const weightSum = orders.reduce((s, o) => s + o.weight, 0);
    if (weightSum <= 0) {
      return orders.map((o) => ({ ...o, refundAmount: 0 }));
    }

    let assigned = 0;
    return orders.map((o, index) => {
      if (index === orders.length - 1) {
        const refundAmount = Math.round((totalRefund - assigned) * 100) / 100;
        return { ...o, refundAmount };
      }
      const refundAmount =
        Math.round(((totalRefund * o.weight) / weightSum) * 100) / 100;
      assigned += refundAmount;
      return { ...o, refundAmount };
    });
  }
}
