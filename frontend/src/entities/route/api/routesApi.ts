import { http } from "@/shared/api/client"
import type { DeliveryRoute } from "@/shared/api/api-types"
import type { Order } from "@/shared/api/api-types"
import { mapBackendOrder } from "@/shared/api/mappers"

export type RouteDeliveryStop = {
  pickupPointId: string
  label: string
  settlementName: string
  address?: string
  status: "pending" | "in_progress" | "completed"
  totalOrders: number
  receivedOrders: number
  inTransitOrders: number
  coords: { lat: number; lng: number }
  isProcurementStop?: boolean
  procurementCompleted?: boolean
  expectsOrders?: boolean
  driverCanComplete?: boolean
}

export type CoordinatorRoute = DeliveryRoute & {
  activeRoundId?: string | null
  hubLabel?: string
  deliveryStops?: RouteDeliveryStop[]
}

export const routesApi = {
  getByDriver: async (_driverId: string): Promise<CoordinatorRoute[]> => {
    return http.get<CoordinatorRoute[]>("/coordinator/routes", true)
  },

  completeRouteStop: (
    roundId: string,
    pickupPointId: string,
  ) =>
    http.post<{ stopCompleted: boolean; roundCompleted: boolean }>(
      `/coordinator/rounds/${roundId}/stops/${pickupPointId}/complete`,
      {},
      true,
    ),

  beginSettlementHandout: (roundId: string, pickupPointId: string) =>
    http.post<{ ordersReadyForConfirm: number }>(
      `/coordinator/rounds/${roundId}/stops/${pickupPointId}/begin-handout`,
      {},
      true,
    ),

  getDriverOrders: async (_driverId: string): Promise<Order[]> => {
    const list = await http.get<
      Parameters<typeof mapBackendOrder>[0][]
    >("/coordinator/orders", true)
    return list.map((o) =>
      mapBackendOrder({
        ...o,
        items: o.items ?? [],
        pickupPointId: o.pickupPointId ?? "",
      }),
    )
  },
}
