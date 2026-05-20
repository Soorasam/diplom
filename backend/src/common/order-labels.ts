import { OrderStatus } from '@prisma/client';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  submitted: 'Оформлен',
  confirmed: 'Подтверждён',
  in_transit: 'В пути к пункту выдачи',
  at_pickup: 'На пункте выдачи',
  delivered: 'Выдан',
  cancelled: 'Отменён',
};

export function calcProgressPercent(participantsCount: number, targetParticipants: number): number {
  if (targetParticipants <= 0) return 0;
  return Math.min(Math.floor((participantsCount * 100) / targetParticipants), 100);
}

export function decimalToNumber(
  value: { toNumber(): number } | number | string | null | undefined,
): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return value.toNumber();
}
