import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private tickets: TicketsService,
  ) {}

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

  async markAllRead(user: User) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return { ok: true as const };
  }

  listDisputes(user: User) {
    return this.tickets.listMine(user);
  }

  createDispute(user: User, dto: CreateDisputeDto) {
    return this.tickets.create(user, { orderId: dto.orderId, body: dto.message });
  }
}
