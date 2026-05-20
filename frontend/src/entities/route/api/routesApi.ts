import { apiCall, http } from "@/shared/api/client"
import { deliveryRoutes, orders, users, type DeliveryRoute } from "@/shared/api/mock-db"

export const routesApi = {
  getAll: async () => {
    try {
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
    } catch {
      return apiCall(() => deliveryRoutes)
    }
  },

  getByDriver: (driverId: string) =>
    apiCall(() => deliveryRoutes.filter((r) => r.driverId === driverId)),

  getDriverOrders: (driverId: string) =>
    apiCall(() => orders.filter((o) => o.userId === driverId)),

  getDrivers: () => apiCall(() => users.filter((u) => u.role === "driver")),
}
