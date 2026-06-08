import { OrderStatus, Prisma } from '@prisma/client';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, decimalToNumber } from './order-labels';

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
  user: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      deliveryAddress: true,
    },
  },
  pickupPoint: { select: { id: true, name: true } },
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
  const totalEstimate = decimalToNumber(order.totalEstimate);
  const refundAmount = decimalToNumber(order.refundAmount);
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
    paymentStatus: order.paymentStatus,
    paymentStatusLabel: PAYMENT_STATUS_LABELS[order.paymentStatus],
    totalEstimate,
    refundAmount,
    netTotal: Math.max(totalEstimate - refundAmount, 0),
    total: totalEstimate,
    comment: order.customerNote,
    deliveryAddress: order.deliveryAddress,
    expectedAt: order.expectedAt,
    createdAt: order.createdAt,
  };
}

export function mapOrderDetail(order: OrderForMapper) {
  const createdAt = order.createdAt.toISOString();
  const totalEstimate = decimalToNumber(order.totalEstimate);
  const refundAmount = decimalToNumber(order.refundAmount);
  return {
    id: order.id,
    publicNumber: order.publicNumber,
    userId: order.userId,
    roundId: order.roundId,
    procurementId: order.roundId,
    pickupPointId: order.pickupPointId,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    paymentStatus: order.paymentStatus,
    paymentStatusLabel: PAYMENT_STATUS_LABELS[order.paymentStatus],
    totalEstimate,
    refundAmount,
    netTotal: Math.max(totalEstimate - refundAmount, 0),
    total: totalEstimate,
    comment: order.customerNote,
    deliveryAddress: order.deliveryAddress,
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
