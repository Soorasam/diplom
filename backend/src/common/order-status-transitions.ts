import { BadRequestException } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';

const EMPLOYEE_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.at_pickup]: [OrderStatus.delivered],
  [OrderStatus.in_transit]: [OrderStatus.at_pickup],
  [OrderStatus.confirmed]: [OrderStatus.at_pickup],
};

/** Координатор не закрывает заказ — только житель после оплаты на месте. */
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
    role === UserRole.employee
      ? EMPLOYEE_TRANSITIONS[from]
      : role === UserRole.coordinator
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
