import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function throwUserUniqueConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target : [];
    if (fields.includes('email')) {
      throw new ConflictException('Этот email уже используется');
    }
    if (fields.includes('phone')) {
      throw new ConflictException('Этот номер телефона уже используется');
    }
    throw new ConflictException('Такие данные уже используются');
  }
  throw error;
}
