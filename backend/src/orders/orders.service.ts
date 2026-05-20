import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, User, UserRole } from '@prisma/client';
import { mapOrderDetail, mapOrderListItem, OrderWithRelations } from '../common/order-mapper';
import { ORDER_STATUS_LABELS } from '../common/order-labels';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const orderInclude = {
  items: true,
  round: { include: { route: true } },
} as const;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async findOrderOrThrow(id: string): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return order as OrderWithRelations;
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
    return orders.map((o) => mapOrderDetail(o as OrderWithRelations));
  }

  async listByPickupPoint(pickupPointId: string) {
    const orders = await this.prisma.order.findMany({
      where: { pickupPointId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => mapOrderDetail(o as OrderWithRelations));
  }

  async getOne(user: User, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    return mapOrderDetail(order as OrderWithRelations);
  }

  async getOneForStaff(user: User, orderId: string) {
    const order = await this.findOrderOrThrow(orderId);
    this.assertStaffCanAccessOrder(user, order);
    return mapOrderDetail(order);
  }

  async updateStatus(user: User, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOrderOrThrow(orderId);
    this.assertStaffCanUpdateStatus(user, order);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        statusNote: ORDER_STATUS_LABELS[dto.status],
      },
      include: orderInclude,
    });
    return mapOrderDetail(updated as OrderWithRelations);
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
    throw new ForbiddenException('Недостаточно прав для смены статуса');
  }
}
