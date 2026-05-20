import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
