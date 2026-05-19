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

export function decimalToNumber(value: { toNumber(): number } | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}
