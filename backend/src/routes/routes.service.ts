import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutePlanDto } from './dto/create-route-plan.dto';
import { RouteWaypointInputDto } from './dto/route-waypoint.dto';

const routeInclude = {
  waypoints: {
    orderBy: { sortOrder: 'asc' as const },
    include: { pickupPoint: true },
  },
} satisfies Prisma.RouteInclude;

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  validateWaypoints(waypoints: RouteWaypointInputDto[]) {
    if (waypoints.length < 2) {
      throw new BadRequestException(
        'Маршрут должен содержать минимум две точки (населённых пункта)',
      );
    }

    const sorted = [...waypoints].sort((a, b) => a.sortOrder - b.sortOrder);
    const first = sorted[0];
    if (!first?.isProcurementPoint) {
      throw new BadRequestException('Начальная точка должна быть точкой закупа');
    }

    if (sorted.some((w) => !w.pickupPointId?.trim())) {
      throw new BadRequestException(
        'Укажите населённый пункт для каждой точки маршрута',
      );
    }

    const ids = sorted.map((w) => w.pickupPointId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Точку нельзя повторять в маршруте');
    }
  }

  async resolveRoutePlanFromTemplate(
    templateRouteId: string,
    userId: string,
  ): Promise<CreateRoutePlanDto> {
    const template = await this.prisma.route.findFirst({
      where: { id: templateRouteId, isTemplate: true, createdByUserId: userId },
      include: { waypoints: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!template) throw new NotFoundException('Шаблон маршрута не найден');
    if (template.waypoints.length === 0) {
      throw new BadRequestException('У сохранённого маршрута нет точек');
    }

    return {
      title: template.title,
      description: template.description ?? undefined,
      seasonNote: template.seasonNote ?? undefined,
      transportType: template.transportType,
      waypoints: template.waypoints.map((w) => ({
        pickupPointId: w.pickupPointId,
        sortOrder: w.sortOrder,
        isProcurementPoint: w.isProcurementPoint,
      })),
    };
  }

  async createTemplate(user: User, dto: CreateRoutePlanDto) {
    this.validateWaypoints(dto.waypoints);

    const pickupPointIds = dto.waypoints.map((w) => w.pickupPointId);
    const found = await this.prisma.pickupPoint.count({
      where: { id: { in: pickupPointIds } },
    });
    if (found !== pickupPointIds.length) {
      throw new BadRequestException('Одна из точек маршрута не найдена');
    }

    const route = await this.prisma.route.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        seasonNote: dto.seasonNote?.trim() || null,
        transportType: dto.transportType,
        isTemplate: true,
        createdByUserId: user.id,
        waypoints: {
          create: dto.waypoints.map((w) => ({
            pickupPointId: w.pickupPointId,
            sortOrder: w.sortOrder,
            isProcurementPoint: w.isProcurementPoint,
          })),
        },
      },
      include: routeInclude,
    });

    return this.mapRoute(route);
  }

  async createRoute(user: User | null, dto: CreateRoutePlanDto, options: { isTemplate: boolean }) {
    if (!options.isTemplate || !user) {
      throw new BadRequestException(
        'Маршрут сбора создаётся вместе со сбором, шаблон — через createTemplate',
      );
    }
    return this.createTemplate(user, dto);
  }

  async listTemplatesForDriver(userId: string) {
    const routes = await this.prisma.route.findMany({
      where: { isTemplate: true, createdByUserId: userId },
      orderBy: { title: 'asc' },
      include: routeInclude,
    });
    return routes.map((r) => this.mapRoute(r));
  }

  async getRoute(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: routeInclude,
    });
    if (!route) throw new NotFoundException('Маршрут не найден');
    return this.mapRoute(route);
  }

  async deleteTemplate(userId: string, routeId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, isTemplate: true, createdByUserId: userId },
    });
    if (!route) throw new NotFoundException('Шаблон маршрута не найден');
    await this.prisma.route.delete({ where: { id: routeId } });
    return { ok: true };
  }

  listLocationsCatalog() {
    return this.prisma.pickupPoint.findMany({
      orderBy: { name: 'asc' },
    }).then((rows) =>
      rows.map((p) => ({
        id: p.id,
        name: p.name,
        district: p.district,
        ulus: p.ulus,
        address: p.address,
        phone: p.phone,
      })),
    );
  }

  listSettlementsWithPickup() {
    return this.listLocationsCatalog();
  }

  mapRoute(route: Prisma.RouteGetPayload<{ include: typeof routeInclude }>) {
    const waypoints = route.waypoints.map((w) => ({
      id: w.id,
      pickupPointId: w.pickupPointId,
      settlementId: w.pickupPointId,
      settlementName: w.pickupPoint.name,
      sortOrder: w.sortOrder,
      isProcurementPoint: w.isProcurementPoint,
      pickupPoint: {
        id: w.pickupPoint.id,
        name: w.pickupPoint.name,
        address: w.pickupPoint.address,
        phone: w.pickupPoint.phone,
      },
    }));

    return {
      id: route.id,
      title: route.title,
      description: route.description,
      seasonNote: route.seasonNote,
      transportType: route.transportType,
      isTemplate: route.isTemplate,
      createdByUserId: route.createdByUserId,
      waypoints,
    };
  }
}
