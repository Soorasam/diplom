import type { Order } from "@/shared/api/api-types"
import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"

export type SettlementOrderBlock = {
  pickupPointId: string
  label: string
  orders: Order[]
}

export const buildSettlementBlocks = (
  stops: RouteDeliveryStop[] | undefined,
  ordersBySettlement: Map<string, Order[]>,
): SettlementOrderBlock[] => {
  const seen = new Set<string>()
  const blocks: SettlementOrderBlock[] = []

  for (const stop of stops ?? []) {
    if (!stop.expectsOrders && !ordersBySettlement.get(stop.pickupPointId)?.length) {
      continue
    }
    seen.add(stop.pickupPointId)
    blocks.push({
      pickupPointId: stop.pickupPointId,
      label: stop.label ?? stop.settlementName ?? "Посёлок",
      orders: ordersBySettlement.get(stop.pickupPointId) ?? [],
    })
  }

  for (const [pickupPointId, orders] of ordersBySettlement) {
    if (seen.has(pickupPointId) || orders.length === 0) continue
    blocks.push({
      pickupPointId,
      label: orders[0]?.settlementName ?? "Посёлок",
      orders,
    })
  }

  return blocks
}
