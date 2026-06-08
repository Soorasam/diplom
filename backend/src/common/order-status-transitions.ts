import { BadRequestException } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';

/** Водитель не закрывает заказ — только житель после подтверждения в приложении. */
const COORDINATOR_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.submitted]: [OrderStatus.confirmed, OrderStatus.cancelled],
  [OrderStatus.confirmed]: [OrderStatus.in_transit, OrderStatus.cancelled],
  [OrderStatus.in_transit]: [OrderStatus.at_pickup],
};

const RESIDENT_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.in_transit]: [OrderStatus.delivered],
};

export function assertOrderStatusTransition(
  role: UserRole,
  from: OrderStatus,
  to: OrderStatus,
) {
  if (role === UserRole.admin) return;

  const allowed =
    role === UserRole.coordinator
      ? COORDINATOR_TRANSITIONS[from]
      : role === UserRole.resident
        ? RESIDENT_TRANSITIONS[from]
        : undefined;

  if (!allowed?.includes(to)) {
    throw new BadRequestException(
      `Нельзя сменить статус заказа с «${from}» на «${to}» для роли ${role}`,
    );
  }
}
