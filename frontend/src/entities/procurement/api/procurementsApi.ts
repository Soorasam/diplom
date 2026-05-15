import { apiCall } from "@/shared/api/client"
import { deliveryRoutes, procurements } from "@/shared/api/mock-db"

export const procurementsApi = {
  getActive: () =>
    apiCall(() =>
      procurements.filter((p) => p.status === "open" || p.status === "closing"),
    ),

  getAll: () => apiCall(() => procurements),

  getById: (id: string) =>
    apiCall(() => {
      const item = procurements.find((p) => p.id === id)
      if (!item) throw new Error("Сбор не найден")
      return item
    }),

  getRoute: (routeId: string) =>
    apiCall(() => deliveryRoutes.find((r) => r.id === routeId)),
}
