import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { CatalogService } from '../catalog/catalog.service';
import { calcRoundProgressPercent, decimalToNumber } from '../common/order-labels';
import { mapOrderDetail, orderDetailInclude } from '../common/order-mapper';
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
      this.prisma.pickupPoint.count(),
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
        pickupPointId: true,
        createdAt: true,
      },
    });
  }

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      include: orderDetailInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => mapOrderDetail(o));
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

  async createSettlement(dto: CreateSettlementDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.pickupPoint.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('Населённый пункт с таким названием уже есть');
    }

    return this.prisma.pickupPoint.create({
      data: {
        name,
        ulus: dto.ulus?.trim() || null,
        district: dto.district?.trim() || dto.ulus?.trim() || null,
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || null,
      },
    });
  }

  listSettlements() {
    return this.prisma.pickupPoint.findMany({ orderBy: { name: 'asc' } });
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
        pickupPointId: true,
      },
    });
  }

  async getDriver(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
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
        pickupPointId: true,
        createdAt: true,
        pickupPoint: { select: { id: true, name: true, ulus: true, address: true } },
        driverApplications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            documents: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Водитель не найден');
    }
    const application = user.driverApplications[0] ?? null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      pickupPointId: user.pickupPointId,
      createdAt: user.createdAt,
      pickupPoint: user.pickupPoint,
      application: application
        ? {
            id: application.id,
            status: application.status,
            vehicleSummary: application.vehicleSummary,
            rejectionReason: application.rejectionReason,
            submittedAt: application.submittedAt,
            reviewedAt: application.reviewedAt,
            documents: application.documents.map((d) => ({
              id: d.id,
              type: d.type,
              url: d.url,
              fileName: d.fileName,
              mimeType: d.mimeType,
            })),
          }
        : null,
    };
  }

  async listRounds() {
    const rounds = await this.prisma.round.findMany({
      include: { waypoints: { include: { pickupPoint: true } } },
      orderBy: { closesAt: 'desc' },
    });
    return rounds.map((r) => ({
      ...r,
      progressPercent: calcRoundProgressPercent(r),
    }));
  }

  listNotifications() {
    return this.prisma.notification
      .findMany({
        where: { user: { role: UserRole.admin } },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true } },
        },
      })
      .then((items) => items.map((n) => this.mapAdminNotification(n)));
  }

  
  private mapAdminNotification(n: {
    id: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: Date;
    user: { id: string; email: string; fullName: string | null; phone: string | null };
  }) {
    const isDispute = n.title.startsWith('Спор по заказу');
    const opened = n.body.match(/^Пользователь (.+?) открыл спор:\s*([\s\S]*)$/);

    return {
      id: n.id,
      title: n.title,
      body: isDispute && opened ? opened[2].trim() : n.body,
      read: n.read,
      createdAt: n.createdAt,
      kind: isDispute ? ('dispute' as const) : ('other' as const),
      reporterName: isDispute && opened ? opened[1].trim() : null,
    };
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
