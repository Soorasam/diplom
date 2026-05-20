import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DriverApplicationStatus,
  DriverDocumentType,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReviewDriverApplicationDto } from './dto/review-driver-application.dto';
import { SubmitDriverApplicationDto } from './dto/submit-driver-application.dto';

const REQUIRED_DOCS: DriverDocumentType[] = [
  DriverDocumentType.passport,
  DriverDocumentType.license,
  DriverDocumentType.sts,
];

@Injectable()
export class DriverApplicationsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private readonly appInclude = {
    user: { select: { id: true, email: true, fullName: true, phone: true, role: true } },
    documents: { orderBy: { createdAt: 'asc' as const } },
  };

  async getMine(user: User) {
    const app = await this.prisma.driverApplication.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { documents: { orderBy: { createdAt: 'asc' } } },
    });
    return app;
  }

  private async ensureDraftApplication(user: User) {
    const existing = await this.prisma.driverApplication.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [DriverApplicationStatus.draft, DriverApplicationStatus.pending],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing?.status === DriverApplicationStatus.pending) {
      throw new BadRequestException('Заявка уже на рассмотрении');
    }

    if (existing) return existing;

    return this.prisma.driverApplication.create({
      data: {
        userId: user.id,
        status: DriverApplicationStatus.draft,
      },
    });
  }

  async uploadDocument(
    user: User,
    type: DriverDocumentType,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Файл не передан');
    }

    const allowed = /^image\/(jpeg|png|webp)$/i;
    if (!allowed.test(file.mimetype)) {
      throw new BadRequestException('Допустимы только изображения JPEG, PNG, WebP');
    }

    const app = await this.ensureDraftApplication(user);
    const ext =
      file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : 'jpg';
    const objectKey = `applications/${app.id}/${type}.${ext}`;
    const bucket = this.storage.driverDocsBucket();
    const url = await this.storage.upload(bucket, objectKey, file.buffer, file.mimetype);

    return this.prisma.driverApplicationDocument.upsert({
      where: {
        applicationId_type: { applicationId: app.id, type },
      },
      create: {
        applicationId: app.id,
        type,
        objectKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        url,
      },
      update: {
        objectKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        url,
      },
    });
  }

  async submit(user: User, dto: SubmitDriverApplicationDto) {
    const app = await this.ensureDraftApplication(user);

    const docs = await this.prisma.driverApplicationDocument.findMany({
      where: { applicationId: app.id },
    });
    const uploadedTypes = new Set(docs.map((d) => d.type));
    const missing = REQUIRED_DOCS.filter((t) => !uploadedTypes.has(t));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Загрузите документы: ${missing.join(', ')}`,
      );
    }

    return this.prisma.driverApplication.update({
      where: { id: app.id },
      data: {
        vehicleSummary: dto.vehicleSummary,
        status: DriverApplicationStatus.pending,
        submittedAt: new Date(),
      },
      include: { documents: true },
    });
  }

  listAll() {
    return this.prisma.driverApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.appInclude,
    });
  }

  async review(id: string, dto: ReviewDriverApplicationDto) {
    const app = await this.prisma.driverApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Заявка не найдена');

    if (dto.status === DriverApplicationStatus.rejected && !dto.rejectionReason) {
      throw new BadRequestException('Укажите причину отказа');
    }

    return this.prisma.driverApplication.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        reviewedAt: new Date(),
      },
      include: this.appInclude,
    });
  }
}
