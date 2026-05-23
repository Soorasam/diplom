import { http } from "@/shared/api/client"
import type { DeliveryRoute } from "@/shared/api/mock-db"
import type { Order } from "@/shared/api/mock-db"
import { mapBackendOrder } from "@/shared/api/mappers"

export type RouteDeliveryStop = {
  pickupPointId: string
  label: string
  settlementName: string
  status: "pending" | "in_progress" | "completed"
  totalOrders: number
  receivedOrders: number
  inTransitOrders: number
  coords: { lat: number; lng: number }
}

export type CoordinatorRoute = DeliveryRoute & {
  activeRoundId?: string | null
  hubLabel?: string
  deliveryStops?: RouteDeliveryStop[]
}

export const routesApi = {
  getAll: async (): Promise<DeliveryRoute[]> => {
    const list = await http.get<
      { id: string; title: string; transportType: string; description?: string | null }[]
    >("/routes")
    return list.map(
      (r): DeliveryRoute => ({
        id: r.id,
        name: r.title,
        fromSettlementId: "",
        toSettlementIds: [],
        deliveryMode:
          r.transportType === "river"
            ? "river"
            : r.transportType === "winter_road"
              ? "winter_road"
              : "mixed",
        status: "active",
        points: [],
      }),
    )
  },

  getByDriver: async (_driverId: string): Promise<CoordinatorRoute[]> => {
    return http.get<CoordinatorRoute[]>("/coordinator/routes", true)
  },

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

  getDrivers: async () => {
    const users = await http.get<
      { id: string; fullName: string | null; email: string; role: string }[]
    >("/admin/users", true)
    return users
      .filter((u) => u.role === "coordinator")
      .map((u) => ({
        id: u.id,
        name: u.fullName ?? u.email,
        phone: "",
        email: u.email,
        role: "driver" as const,
        settlementId: "",
      }))
  },
}
