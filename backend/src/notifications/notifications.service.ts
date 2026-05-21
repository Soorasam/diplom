import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  list(user: User) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(user: User, id: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!n) throw new NotFoundException('Уведомление не найдено');
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  listDisputes(user: User) {
    return this.prisma.notification.findMany({
      where: { userId: user.id, title: { startsWith: 'Спор по заказу' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDispute(user: User, dto: CreateDisputeDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: { id: true, userId: true, publicNumber: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.userId !== user.id) throw new ForbiddenException('Можно открыть спор только по своему заказу');

    const title = `Спор по заказу ${order.publicNumber}`;
    const body = dto.message.trim();
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.admin },
      select: { id: true },
    });

    const [userNotification] = await this.prisma.$transaction([
      this.prisma.notification.create({
        data: {
          userId: user.id,
          title,
          body: `Ваш спор принят: ${body}`,
          read: false,
        },
      }),
      ...admins.map((a) =>
        this.prisma.notification.create({
          data: {
            userId: a.id,
            title,
            body: `Пользователь ${user.fullName ?? user.email} открыл спор: ${body}`,
            read: false,
          },
        }),
      ),
    ]);

    return userNotification;
  }
}
