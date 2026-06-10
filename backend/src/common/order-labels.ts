import { OrderStatus, PaymentStatus } from '@prisma/client';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  submitted: 'Оформлен, ожидает подтверждения',
  confirmed: 'Принят в рейс',
  in_transit: 'В пути в ваш посёлок',
  at_pickup: 'Ожидает подтверждения',
  delivered: 'Получен',
  cancelled: 'Отменён',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Ожидает оплаты',
  held: 'Зарезервировано на платформе',
  released: 'Выплачено водителю',
  refunded: 'Возвращено заказчику',
};

export function calcProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.floor((current * 100) / target), 100);
}

export type RoundWeightSource = {
  currentWeightKg?: { toNumber(): number } | number | string | null;
  targetWeightKg?: { toNumber(): number } | number | string | null;
  participantsCount?: number;
  targetParticipants?: number;
};

export function roundWeightTotals(round: RoundWeightSource) {
  const targetFromKg = decimalToNumber(round.targetWeightKg);
  if (targetFromKg > 0) {
    return {
      currentKg: decimalToNumber(round.currentWeightKg),
      targetKg: targetFromKg,
    };
  }
  return {
    currentKg: round.participantsCount ?? 0,
    targetKg: Math.max(round.targetParticipants ?? 1, 1),
  };
}

export function calcRoundProgressPercent(round: RoundWeightSource): number {
  const { currentKg, targetKg } = roundWeightTotals(round);
  return calcProgressPercent(currentKg, targetKg);
}

export function calcLineWeightKg(
  weightKg: number,
  quantity: number,
  unit: string,
): number {
  const w = weightKg > 0 ? weightKg : 1;
  if (unit === 'кг' || unit === 'kg') return w * quantity;
  return w * quantity;
}

export function decimalToNumber(
  value: { toNumber(): number } | number | string | null | undefined,
): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return value.toNumber();
}
