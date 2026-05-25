import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | User[keyof User] => {
    const user = ctx.switchToHttp().getRequest<{ user: User }>().user;
    return data ? user[data] : user;
  },
);
