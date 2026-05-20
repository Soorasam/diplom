import { Injectable, ForbiddenException } from '@nestjs/common';
import { DriverApplicationStatus, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  private toUserRead(user: User) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      settlementId: user.settlementId,
      pickupPointId: user.pickupPointId,
    };
  }

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
    return this.toUserRead(updated);
  }

  async switchRole(user: User, dto: SwitchRoleDto) {
    if (user.role === UserRole.admin || user.role === UserRole.employee) {
      throw new ForbiddenException('Смена роли недоступна для этой учётной записи');
    }

    const targetRole = dto.role === 'coordinator' ? UserRole.coordinator : UserRole.resident;

    if (targetRole === UserRole.coordinator) {
      const approved = await this.prisma.driverApplication.findFirst({
        where: { userId: user.id, status: DriverApplicationStatus.approved },
      });
      if (!approved && user.role !== UserRole.coordinator) {
        throw new ForbiddenException('Нет одобренной заявки водителя');
      }
    }

    if (user.role === targetRole) {
      return this.toUserRead(user);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { role: targetRole },
    });
    return this.toUserRead(updated);
  }
}
