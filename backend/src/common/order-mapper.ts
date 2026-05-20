import { OrderStatus } from '@prisma/client';
import { ORDER_STATUS_LABELS, decimalToNumber } from './order-labels';

export type OrderWithRelations = {
  id: string;
  publicNumber: string;
  userId: string;
  roundId: string;
  pickupPointId: string | null;
  status: OrderStatus;
  totalEstimate: { toNumber(): number } | number;
  statusNote: string | null;
  expectedAt: Date | null;
  createdAt: Date;
  round: { title: string | null; route: { title: string } };
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    priceSnapshot: { toNumber(): number } | number;
  }[];
};

export function orderTitle(order: OrderWithRelations): string {
  return `Сбор «${order.round.title ?? order.round.route.title}»`;
}

export function mapOrderListItem(order: OrderWithRelations) {
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

export function mapOrderDetail(order: OrderWithRelations) {
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
