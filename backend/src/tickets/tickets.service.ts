import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus, User, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AddTicketMessageDto } from './dto/add-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const ALLOWED_MIME = /^image\/(jpeg|png|webp)$|^application\/pdf$/;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  listMine(user: User) {
    return this.prisma.ticket
      .findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          order: { select: { publicNumber: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { body: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      })
      .then((rows) => rows.map((t) => this.mapSummary(t, user)));
  }

  listAllForAdmin() {
    return this.prisma.ticket
      .findMany({
        orderBy: { updatedAt: 'desc' },
        take: 300,
        include: {
          user: {
            select: { id: true, email: true, fullName: true, phone: true },
          },
          order: { select: { publicNumber: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { body: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      })
      .then((rows) => rows.map((t) => this.mapAdminSummary(t)));
  }

  async findByOrder(user: User, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (user.role !== UserRole.admin && order.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к заказу');
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        orderId: order.id,
        ...(user.role !== UserRole.admin ? { userId: user.id } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        order: { select: { publicNumber: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true },
        },
        _count: { select: { messages: true } },
        ...(user.role === UserRole.admin
          ? {
              user: {
                select: { id: true, email: true, fullName: true, phone: true },
              },
            }
          : {}),
      },
    });

    if (!ticket) return null;

    if (user.role === UserRole.admin) {
      return this.mapAdminSummary(
        ticket as Parameters<typeof this.mapAdminSummary>[0],
      );
    }
    return this.mapSummary(ticket, user);
  }

  async getById(user: User, id: string) {
    const ticket = await this.loadTicket(id);
    this.assertCanView(user, ticket.userId);
    if (user.role === UserRole.admin) {
      await this.prisma.ticket.update({
        where: { id },
        data: { unreadByAdmin: false },
      });
      ticket.unreadByAdmin = false;
    } else if (ticket.userId === user.id) {
      await this.prisma.ticket.update({
        where: { id },
        data: { unreadByUser: false },
      });
      ticket.unreadByUser = false;
      await this.prisma.notification.updateMany({
        where: { userId: user.id, ticketId: id, read: false },
        data: { read: true },
      });
    }
    return this.mapDetail(ticket, user);
  }

  async create(user: User, dto: CreateTicketDto, files: UploadFile[] = []) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: { id: true, userId: true, publicNumber: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.userId !== user.id) {
      throw new ForbiddenException('Можно открыть обращение только по своему заказу');
    }

    const existing = await this.prisma.ticket.findFirst({
      where: {
        userId: user.id,
        orderId: order.id,
        status: { in: [TicketStatus.open, TicketStatus.in_progress] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'По этому заказу уже есть открытое обращение. Продолжите переписку в нём.',
      );
    }

    const subject = `Спор по заказу ${order.publicNumber}`;
    const body = dto.body.trim();
    this.validateFiles(files);

    const ticket = await this.prisma.ticket.create({
      data: {
        userId: user.id,
        orderId: order.id,
        subject,
        status: TicketStatus.open,
        unreadByAdmin: true,
        unreadByUser: false,
      },
    });

    await this.addMessageInternal(ticket.id, user, body, files);
    await this.notifyAdminsNewTicket(user, subject, body);

    const full = await this.loadTicket(ticket.id);
    return this.mapDetail(full, user);
  }

  async addMessage(
    user: User,
    ticketId: string,
    dto: AddTicketMessageDto,
    files: UploadFile[] = [],
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true },
    });
    if (!ticket) throw new NotFoundException('Обращение не найдено');
    this.assertCanView(user, ticket.userId);

    if (
      user.role !== UserRole.admin &&
      (ticket.status === TicketStatus.resolved || ticket.status === TicketStatus.closed)
    ) {
      throw new BadRequestException('Обращение закрыто — новые сообщения недоступны');
    }

    this.validateFiles(files);
    const body = (dto.body ?? '').trim();
    if (!body && files.length === 0) {
      throw new BadRequestException('Введите текст или прикрепите файл');
    }
    await this.addMessageInternal(ticketId, user, body, files);

    const isAdmin = user.role === UserRole.admin;
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        unreadByAdmin: isAdmin ? false : true,
        unreadByUser: isAdmin,
        status:
          isAdmin && ticket.status === TicketStatus.open
            ? TicketStatus.in_progress
            : undefined,
      },
    });

    if (isAdmin) {
      await this.notifyUserReply(ticket.userId, ticketId, body);
    }

    const full = await this.loadTicket(ticketId);
    return this.mapDetail(full, user);
  }

  async updateStatus(user: User, ticketId: string, dto: UpdateTicketStatusDto) {
    if (user.role !== UserRole.admin) {
      throw new ForbiddenException('Только администратор может менять статус');
    }
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Обращение не найдено');

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        unreadByUser: dto.status !== ticket.status,
      },
    });

    if (dto.status === TicketStatus.resolved || dto.status === TicketStatus.closed) {
      await this.prisma.notification.create({
        data: {
          userId: ticket.userId,
          ticketId: ticket.id,
          title: 'Обращение обновлено',
          body: `Статус вашего обращения: ${this.statusLabel(dto.status)}`,
          read: false,
        },
      });
    }

    const full = await this.loadTicket(updated.id);
    return this.mapDetail(full, user);
  }

  private async addMessageInternal(
    ticketId: string,
    author: User,
    body: string,
    files: UploadFile[],
  ) {
    const message = await this.prisma.ticketMessage.create({
      data: { ticketId, authorId: author.id, body },
    });

    if (files.length > 0) {
      const attachments = await Promise.all(
        files.map((file) => this.uploadAttachment(message.id, file)),
      );
      await this.prisma.ticketAttachment.createMany({
        data: attachments,
      });
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });
  }

  private async uploadAttachment(messageId: string, file: UploadFile) {
    const ext =
      file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : file.mimetype === 'application/pdf'
            ? 'pdf'
            : 'jpg';
    const key = `messages/${messageId}/${randomUUID()}.${ext}`;
    const url = await this.storage.upload(
      this.storage.ticketsBucket(),
      key,
      file.buffer,
      file.mimetype,
    );
    return {
      messageId,
      url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private validateFiles(files: UploadFile[]) {
    if (files.length > MAX_FILES) {
      throw new BadRequestException(`Не более ${MAX_FILES} файлов за сообщение`);
    }
    for (const file of files) {
      if (!file?.buffer?.length) {
        throw new BadRequestException('Пустой файл');
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new BadRequestException('Файл слишком большой (макс. 10 МБ)');
      }
      if (!ALLOWED_MIME.test(file.mimetype)) {
        throw new BadRequestException('Допустимы JPG, PNG, WebP или PDF');
      }
    }
  }

  private assertCanView(user: User, ticketOwnerId: string) {
    if (user.role === UserRole.admin) return;
    if (user.id === ticketOwnerId) return;
    throw new ForbiddenException('Нет доступа к обращению');
  }

  private async loadTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true, role: true },
        },
        order: { select: { id: true, publicNumber: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, email: true, fullName: true, role: true },
            },
            attachments: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Обращение не найдено');
    return ticket;
  }

  private async notifyAdminsNewTicket(user: User, subject: string, preview: string) {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.admin },
      select: { id: true },
    });
    const name = user.fullName ?? user.email;
    const body = `Пользователь ${name} открыл обращение: ${preview.slice(0, 500)}`;
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: subject,
        body,
        read: false,
      })),
    });
  }

  private async notifyUserReply(userId: string, ticketId: string, preview: string) {
    await this.prisma.notification.create({
      data: {
        userId,
        ticketId,
        title: 'Ответ по обращению',
        body: preview.slice(0, 500),
        read: false,
      },
    });
  }

  private statusLabel(status: TicketStatus) {
    switch (status) {
      case TicketStatus.open:
        return 'открыто';
      case TicketStatus.in_progress:
        return 'в работе';
      case TicketStatus.resolved:
        return 'решено';
      case TicketStatus.closed:
        return 'закрыто';
      default:
        return status;
    }
  }

  private mapSummary(
    t: {
      id: string;
      subject: string;
      status: TicketStatus;
      orderId: string | null;
      unreadByUser: boolean;
      createdAt: Date;
      updatedAt: Date;
      order: { publicNumber: string } | null;
      messages: { body: string; createdAt: Date }[];
      _count: { messages: number };
    },
    user: User,
  ) {
    const last = t.messages[0];
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      orderId: t.orderId,
      orderPublicNumber: t.order?.publicNumber ?? null,
      unread: user.role === UserRole.admin ? false : t.unreadByUser,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      lastMessagePreview: last?.body?.slice(0, 120) ?? null,
      messageCount: t._count.messages,
    };
  }

  private mapAdminSummary(t: {
    id: string;
    subject: string;
    status: TicketStatus;
    orderId: string | null;
    unreadByAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; email: string; fullName: string | null; phone: string | null };
    order: { publicNumber: string } | null;
    messages: { body: string; createdAt: Date }[];
    _count: { messages: number };
  }) {
    const last = t.messages[0];
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      orderId: t.orderId,
      orderPublicNumber: t.order?.publicNumber ?? null,
      unread: t.unreadByAdmin,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      lastMessagePreview: last?.body?.slice(0, 120) ?? null,
      messageCount: t._count.messages,
      user: {
        id: t.user.id,
        name: t.user.fullName ?? t.user.email,
        email: t.user.email,
        phone: t.user.phone,
      },
    };
  }

  private mapDetail(
    t: Awaited<ReturnType<typeof this.loadTicket>>,
    viewer: User,
  ) {
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      orderId: t.orderId,
      orderPublicNumber: t.order?.publicNumber ?? null,
      unread:
        viewer.role === UserRole.admin ? t.unreadByAdmin : t.unreadByUser,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t._count.messages,
      user: {
        id: t.user.id,
        name: t.user.fullName ?? t.user.email,
        email: t.user.email,
        phone: t.user.phone,
        role: t.user.role,
      },
      messages: t.messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        author: {
          id: m.author.id,
          name: m.author.fullName ?? m.author.email,
          role: m.author.role,
          isSelf: m.author.id === viewer.id,
        },
        attachments: m.attachments.map((a) => ({
          id: a.id,
          url: a.url,
          fileName: a.fileName,
          mimeType: a.mimeType,
          size: a.size,
        })),
      })),
    };
  }
}
