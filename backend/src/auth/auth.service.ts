import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type TokenPair = { access_token: string; refresh_token: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

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

  private signTokens(userId: string): TokenPair {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    const accessExpires = this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '60m';
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';

    return {
      access_token: this.jwt.sign(
        { sub: userId, type: 'access' },
        { secret, expiresIn: accessExpires as `${number}m` | `${number}d` },
      ),
      refresh_token: this.jwt.sign(
        { sub: userId, type: 'refresh' },
        { secret, expiresIn: refreshExpires as `${number}m` | `${number}d` },
      ),
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const phone = dto.phone ?? null;

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Email уже зарегистрирован');
    }

    if (phone) {
      const phoneTaken = await this.prisma.user.findUnique({ where: { phone } });
      if (phoneTaken) {
        throw new ConflictException('Телефон уже зарегистрирован');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          phone,
          fullName: dto.fullName,
          hashedPassword,
          settlementId: dto.settlementId,
          pickupPointId: dto.pickupPointId,
        },
      });

      const tokens = this.signTokens(user.id);
      return { ...tokens, token_type: 'bearer', user: this.toUserRead(user) };
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  private rethrowUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target : [];
      if (fields.includes('email')) {
        throw new ConflictException('Email уже зарегистрирован');
      }
      if (fields.includes('phone')) {
        throw new ConflictException('Телефон уже зарегистрирован');
      }
      throw new ConflictException('Такой пользователь уже существует');
    }
    throw error;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.hashedPassword))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const tokens = this.signTokens(user.id);
    return { ...tokens, token_type: 'bearer', user: this.toUserRead(user) };
  }

  async refresh(refreshToken: string) {
    try {
      const secret = this.config.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwt.verify<{ sub: string; type: string }>(refreshToken, { secret });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Недействительный refresh-токен');
      }
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.isActive) {
        throw new UnauthorizedException('Пользователь не найден');
      }
      const tokens = this.signTokens(user.id);
      return { ...tokens, token_type: 'bearer' };
    } catch {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }
  }

  me(user: User) {
    return this.toUserRead(user);
  }
}
