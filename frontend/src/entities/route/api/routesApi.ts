import { apiCall } from "@/shared/api/client"
import { deliveryRoutes, orders, users } from "@/shared/api/mock-db"

export const routesApi = {
  getAll: () => apiCall(() => deliveryRoutes),

  getByDriver: (driverId: string) =>
    apiCall(() => deliveryRoutes.filter((r) => r.driverId === driverId)),

  getDriverOrders: (driverId: string) =>
    apiCall(async () => {
      const routes = deliveryRoutes.filter((r) => r.driverId === driverId)
      const routeIds = routes.map((r) => r.id)
      const { procurements } = await import("@/shared/api/mock-db")
      const procurementIds = procurements
        .filter((p) => routeIds.includes(p.routeId))
        .map((p) => p.id)
      return orders.filter((o) => procurementIds.includes(o.procurementId))
    }),

  getDrivers: () => apiCall(() => users.filter((u) => u.role === "driver")),
}
