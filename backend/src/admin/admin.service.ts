import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CatalogService } from '../catalog/catalog.service';
import { calcRoundProgressPercent, decimalToNumber } from '../common/order-labels';
import { mapOrderDetail, OrderWithRelations } from '../common/order-mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private catalog: CatalogService,
  ) {}

  async getStats() {
    const [orders, users, products, routes, settlements, drivers] = await Promise.all([
      this.prisma.order.findMany({ select: { totalEstimate: true, createdAt: true } }),
      this.prisma.user.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.route.count(),
      this.prisma.settlement.count(),
      this.prisma.user.count({
        where: {
          OR: [
            { role: UserRole.coordinator },
            { driverApplications: { some: { status: 'approved' } } },
          ],
        },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = orders.filter((o) => o.createdAt >= today).length;
    const revenue = orders.reduce((s, o) => s + decimalToNumber(o.totalEstimate), 0);

    const activeProcurements = await this.prisma.round.count({ where: { status: 'open' } });

    return {
      ordersToday,
      revenue,
      revenueMonth: revenue,
      activeUsers: users,
      participants: users,
      productsCount: products,
      routesCount: routes,
      settlementsCount: settlements,
      settlements: settlements,
      driversCount: drivers,
      driversActive: drivers,
      activeProcurements,
      procurementsOpen: activeProcurements,
    };
  }

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        settlementId: true,
        pickupPointId: true,
        createdAt: true,
      },
    });
  }

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      include: { items: true, round: { include: { route: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => mapOrderDetail(o as OrderWithRelations));
  }

  async listProducts() {
    const items = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return items.map((p) => this.catalog.mapProduct(p));
  }

  listRoutes() {
    return this.prisma.route.findMany({ orderBy: { title: 'asc' } });
  }

  listSettlements() {
    return this.prisma.settlement.findMany({ orderBy: { name: 'asc' } });
  }

  listDrivers() {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { role: UserRole.coordinator },
          { driverApplications: { some: { status: 'approved' } } },
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        settlementId: true,
        pickupPointId: true,
      },
    });
  }

  listPickupPoints() {
    return this.prisma.pickupPoint.findMany({
      orderBy: { coordinatorName: 'asc' },
      include: {
        settlement: { select: { id: true, name: true, ulus: true } },
        users: {
          where: { role: UserRole.employee },
          select: { id: true, email: true, fullName: true, phone: true },
        },
      },
    });
  }

  async listRounds() {
    const rounds = await this.prisma.round.findMany({
      include: { route: true },
      orderBy: { closesAt: 'desc' },
    });
    return rounds.map((r) => ({
      ...r,
      progressPercent: calcRoundProgressPercent(r),
    }));
  }

  listNotifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
      },
    });
  }

  async resolveNotification(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, read: true },
    });
    if (!notification) throw new NotFoundException('Обращение не найдено');
    if (notification.read) return notification;

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
