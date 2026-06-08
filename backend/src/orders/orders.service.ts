import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, RoundStatus, User, UserRole } from '@prisma/client';
import { assertOrderStatusTransition } from '../common/order-status-transitions';
import {
  mapOrderDetail,
  mapOrderListItem,
  orderInclude,
  OrderWithRelations,
} from '../common/order-mapper';
import { ORDER_STATUS_LABELS } from '../common/order-labels';
import { DeliveryStopsService } from '../logistics/delivery-stops.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type OrderWithUser = OrderWithRelations;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private deliveryStops: DeliveryStopsService,
  ) {}

  private async findOrderOrThrow(id: string): Promise<OrderWithUser> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return order;
  }

  private withCustomer(order: OrderWithUser) {
    const base = mapOrderDetail(order);
    const user = order.user;
    return {
      ...base,
      customerName: user?.fullName ?? user?.email ?? order.userId,
      customerPhone: user?.phone ?? null,
    };
  }

  async list(user: User) {
    const orders = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => mapOrderListItem(o));
  }

  async listAll() {
    const orders = await this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.withCustomer(o));
  }

  async listByPickupPoint(pickupPointId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        pickupPointId,
        status: {
          in: [
            OrderStatus.confirmed,
            OrderStatus.in_transit,
            OrderStatus.at_pickup,
            OrderStatus.delivered,
          ],
        },
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.withCustomer(o));
  }

  async getOne(user: User, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return this.withCustomer(order);
  }

  async getOneForStaff(user: User, orderId: string) {
    const order = await this.findOrderOrThrow(orderId);
    this.assertStaffCanAccessOrder(user, order);
    return this.withCustomer(order);
  }

  /**
   * Эскроу: заказчик «оплачивает» в приложении — сумма резервируется на платформе.
   * Пилот: симуляция без реального эквайринга.
   */
  async reservePayment(user: User, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ не найден');

    if (order.status === OrderStatus.cancelled) {
      throw new BadRequestException('Нельзя оплатить отменённый заказ');
    }
    if (order.paymentStatus === PaymentStatus.held) {
      return this.withCustomer(order);
    }
    if (order.paymentStatus !== PaymentStatus.pending) {
      throw new BadRequestException('Оплата по этому заказу уже обработана');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.held },
      include: orderInclude,
    });
    return this.withCustomer(updated);
  }

  async updateStatus(user: User, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOrderOrThrow(orderId);
    this.assertStaffCanUpdateStatus(user, order);
    assertOrderStatusTransition(user.role, order.status, dto.status);

    if (
      dto.status === OrderStatus.confirmed &&
      user.role !== UserRole.admin &&
      order.paymentStatus !== PaymentStatus.held
    ) {
      throw new BadRequestException(
        'Заказ не оплачен — средства должны быть зарезервированы на платформе',
      );
    }

    const paymentUpdate = this.paymentStatusOnOrderCancel(order.paymentStatus, dto.status);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        statusNote: ORDER_STATUS_LABELS[dto.status],
        ...(paymentUpdate ? { paymentStatus: paymentUpdate } : {}),
      },
      include: orderInclude,
    });

    await this.syncDeliveryStopAfterStatusChange(
      order.roundId,
      order.pickupPointId,
      dto.status,
    );

    return this.withCustomer(updated);
  }

  /**
   * Житель подтверждает получение — платформа выплачивает водителю (released).
   */
  async confirmReceipt(user: User, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ не найден');

    assertOrderStatusTransition(user.role, order.status, OrderStatus.delivered);

    if (order.paymentStatus !== PaymentStatus.held) {
      throw new BadRequestException(
        'Средства по заказу не зарезервированы — сначала оплатите в приложении',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.delivered,
        statusNote: ORDER_STATUS_LABELS.delivered,
        paymentStatus: PaymentStatus.released,
      },
      include: orderInclude,
    });

    await this.syncDeliveryStopAfterStatusChange(
      order.roundId,
      order.pickupPointId,
      OrderStatus.delivered,
    );

    return this.withCustomer(updated);
  }

  private paymentStatusOnOrderCancel(
    current: PaymentStatus,
    nextStatus: OrderStatus,
  ): PaymentStatus | null {
    if (nextStatus !== OrderStatus.cancelled) return null;
    if (current === PaymentStatus.held) return PaymentStatus.refunded;
    return null;
  }

  private async syncDeliveryStopAfterStatusChange(
    roundId: string | null | undefined,
    pickupPointId: string | null | undefined,
    newStatus: OrderStatus,
  ) {
    if (!roundId || !pickupPointId) return;

    await this.deliveryStops.syncStopsForRound(roundId);

    if (newStatus === OrderStatus.in_transit) {
      await this.deliveryStops.markStopInProgress(roundId, pickupPointId);
      return;
    }

    if (newStatus === OrderStatus.at_pickup || newStatus === OrderStatus.delivered) {
      await this.deliveryStops.refreshStopCompletion(roundId, pickupPointId);
    }
  }

  private assertStaffCanAccessOrder(user: User, order: OrderWithRelations) {
    if (user.role === UserRole.admin) return;
    if (user.role === UserRole.coordinator) return;
    throw new ForbiddenException('Нет доступа к заказу');
  }

  private assertStaffCanUpdateStatus(user: User, order: OrderWithRelations) {
    if (user.role === UserRole.admin) return;
    if (user.role === UserRole.coordinator) return;
    throw new ForbiddenException('Недостаточно прав для смены статуса');
  }
}

