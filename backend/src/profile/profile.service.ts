import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DriverApplicationStatus, User, UserRole } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { throwUserUniqueConflict } from '../common/user-unique.conflict';
import { PrismaService } from '../prisma/prisma.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
  ) {}

  private toUserRead(user: User) {
    return this.auth.toUserRead(user);
  }

  async update(user: User, dto: UpdateProfileDto) {
    if (dto.phone) {
      const phoneTaken = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id: user.id } },
      });
      if (phoneTaken) {
        throw new ConflictException('Этот номер телефона уже используется');
      }
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          pickupPointId: dto.pickupPointId ?? dto.settlementId,
        },
      });
      return this.toUserRead(updated);
    } catch (error) {
      throwUserUniqueConflict(error);
    }
  }

  async setPassword(user: User, dto: SetPasswordDto) {
    if (user.role !== UserRole.employee) {
      throw new ForbiddenException('Смена пароля через этот метод только для сотрудника ПВЗ');
    }

    if (user.mustChangePassword) {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          hashedPassword: await bcrypt.hash(dto.newPassword, 10),
          mustChangePassword: false,
        },
      });
      return this.toUserRead(updated);
    }

    if (!dto.currentPassword) {
      throw new BadRequestException('Укажите текущий пароль');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.hashedPassword);
    if (!valid) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword: await bcrypt.hash(dto.newPassword, 10),
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
