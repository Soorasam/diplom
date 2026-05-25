import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, RoundStatus, User, UserRole } from '@prisma/client';
import { assertOrderStatusTransition } from '../common/order-status-transitions';
import { mapOrderDetail, mapOrderListItem, OrderWithRelations } from '../common/order-mapper';
import { ORDER_STATUS_LABELS } from '../common/order-labels';
import { DeliveryStopsService } from '../logistics/delivery-stops.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const orderInclude = {
  items: true,
  round: { include: { route: true } },
  user: { select: { id: true, fullName: true, phone: true, email: true } },
} as const;

type OrderWithUser = OrderWithRelations & {
  user?: { id: string; fullName: string | null; phone: string | null; email: string };
};

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
    return order as OrderWithUser;
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
    return orders.map((o) => mapOrderListItem(o as OrderWithRelations));
  }

  async listAll() {
    const orders = await this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.withCustomer(o as OrderWithUser));
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
    return orders.map((o) => this.withCustomer(o as OrderWithUser));
  }

  async getOne(user: User, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return this.withCustomer(order as OrderWithUser);
  }

  async getOneForStaff(user: User, orderId: string) {
    const order = await this.findOrderOrThrow(orderId);
    this.assertStaffCanAccessOrder(user, order);
    return this.withCustomer(order);
  }

  async updateStatus(user: User, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOrderOrThrow(orderId);
    this.assertStaffCanUpdateStatus(user, order);
    assertOrderStatusTransition(user.role, order.status, dto.status);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        statusNote: ORDER_STATUS_LABELS[dto.status],
      },
      include: orderInclude,
    });

    await this.syncDeliveryStopAfterStatusChange(
      order.roundId,
      order.pickupPointId,
      dto.status,
    );

    return this.withCustomer(updated as OrderWithUser);
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
      const completion = await this.deliveryStops.refreshStopCompletion(
        roundId,
        pickupPointId,
      );
      if (completion.roundCompleted) {
        await this.prisma.round.update({
          where: { id: roundId },
          data: { status: RoundStatus.fulfilled },
        });
      }
    }
  }

  private assertStaffCanAccessOrder(user: User, order: OrderWithRelations) {
    if (user.role === UserRole.admin) return;
    if (user.role === UserRole.employee && user.pickupPointId === order.pickupPointId) return;
    if (user.role === UserRole.coordinator) return;
    throw new ForbiddenException('Нет доступа к заказу');
  }

  private assertStaffCanUpdateStatus(user: User, order: OrderWithRelations) {
    if (user.role === UserRole.admin) return;
    if (user.role === UserRole.employee && user.pickupPointId === order.pickupPointId) return;
    if (user.role === UserRole.coordinator) return;
    throw new ForbiddenException('Недостаточно прав для смены статуса');
  }
}
