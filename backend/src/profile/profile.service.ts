import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async update(user: User, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        settlementId: dto.settlementId,
        pickupPointId: dto.pickupPointId,
      },
    });
    return {
      id: updated.id,
      email: updated.email,
      phone: updated.phone,
      fullName: updated.fullName,
      role: updated.role,
      settlementId: updated.settlementId,
      pickupPointId: updated.pickupPointId,
    };
  }
}
