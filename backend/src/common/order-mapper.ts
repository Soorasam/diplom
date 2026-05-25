import { OrderStatus, Prisma } from '@prisma/client';
import { ORDER_STATUS_LABELS, decimalToNumber } from './order-labels';

const orderRoundInclude = {
  waypoints: {
    orderBy: { sortOrder: 'asc' as const },
    include: { pickupPoint: true },
  },
} satisfies Prisma.RoundInclude;

export const orderDetailInclude = {
  items: true,
  round: { include: orderRoundInclude },
} satisfies Prisma.OrderInclude;

export const orderInclude = {
  ...orderDetailInclude,
  user: { select: { id: true, fullName: true, phone: true, email: true } },
} satisfies Prisma.OrderInclude;

export type OrderForMapper = Prisma.OrderGetPayload<{
  include: typeof orderDetailInclude;
}>;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export function orderTitle(order: OrderForMapper): string {
  const sorted = order.round.waypoints ?? [];
  const fromWaypoints = sorted.map((w) => w.pickupPoint.name).join(' → ');
  const chain =
    order.round.title?.trim() ||
    order.round.routeTitle?.trim() ||
    fromWaypoints ||
    'Сбор';
  return `Сбор «${chain}»`;
}

export function mapOrderListItem(order: OrderForMapper) {
  return {
    id: order.id,
    publicNumber: order.publicNumber,
    userId: order.userId,
    roundId: order.roundId,
    procurementId: order.roundId,
    pickupPointId: order.pickupPointId,
    title: orderTitle(order),
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    totalEstimate: decimalToNumber(order.totalEstimate),
    total: decimalToNumber(order.totalEstimate),
    expectedAt: order.expectedAt,
    createdAt: order.createdAt,
  };
}

export function mapOrderDetail(order: OrderForMapper) {
  const createdAt = order.createdAt.toISOString();
  return {
    id: order.id,
    publicNumber: order.publicNumber,
    userId: order.userId,
    roundId: order.roundId,
    procurementId: order.roundId,
    pickupPointId: order.pickupPointId,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    totalEstimate: decimalToNumber(order.totalEstimate),
    total: decimalToNumber(order.totalEstimate),
    statusNote: order.statusNote,
    expectedAt: order.expectedAt,
    createdAt: order.createdAt,
    title: orderTitle(order),
    items: order.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unit: i.unit,
      price: decimalToNumber(i.priceSnapshot),
      priceSnapshot: decimalToNumber(i.priceSnapshot),
    })),
    timeline: [
      {
        status: order.status,
        at: createdAt,
        label: ORDER_STATUS_LABELS[order.status],
      },
    ],
  };
}
