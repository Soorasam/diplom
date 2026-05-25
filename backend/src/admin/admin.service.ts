import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreatePvzEmployeeDto } from './dto/create-pvz-employee.dto';
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

  private generateTemporaryPassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i]! % chars.length];
    }
    return result;
  }

  async createPvzEmployee(dto: CreatePvzEmployeeDto) {
    const email = dto.email.trim().toLowerCase();
    const pickupPoint = await this.prisma.pickupPoint.findUnique({
      where: { id: dto.pickupPointId },
      include: { settlement: true },
    });
    if (!pickupPoint) {
      throw new NotFoundException('Пункт выдачи не найден');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Этот email уже используется');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          hashedPassword,
          fullName: dto.fullName?.trim() || `Сотрудник ${pickupPoint.coordinatorName}`,
          role: UserRole.employee,
          settlementId: pickupPoint.settlementId,
          pickupPointId: pickupPoint.id,
          mustChangePassword: true,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          pickupPointId: user.pickupPointId,
          mustChangePassword: true,
        },
        temporaryPassword,
        pickupPoint: {
          id: pickupPoint.id,
          name: pickupPoint.coordinatorName,
          settlementName: pickupPoint.settlement.name,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Этот email уже используется');
      }
      throw error;
    }
  }

  createRoute(dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        transportType: dto.transportType,
        seasonNote: dto.seasonNote?.trim() || null,
      },
    });
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
        settlementId: true,
        pickupPointId: true,
        createdAt: true,
        settlement: { select: { id: true, name: true, ulus: true } },
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
      settlementId: user.settlementId,
      pickupPointId: user.pickupPointId,
      createdAt: user.createdAt,
      settlement: user.settlement,
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
