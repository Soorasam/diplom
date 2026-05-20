import { apiCall, http } from "@/shared/api/client"
import { deliveryRoutes, procurements } from "@/shared/api/mock-db"
import type { BackendRound } from "@/shared/api/backend-types"
import { mapRound } from "@/shared/api/mappers"

export const procurementsApi = {
  getActive: async () => {
    const rounds = await http.get<BackendRound[]>("/rounds?status=open")
    return rounds.map(mapRound)
  },

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
