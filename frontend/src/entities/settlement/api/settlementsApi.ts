import { apiCall } from "@/shared/api/client"
import { pickupPoints, settlements } from "@/shared/api/mock-db"

export const settlementsApi = {
  getAll: () => apiCall(() => settlements),
  getById: (id: string) =>
    apiCall(() => {
      const s = settlements.find((x) => x.id === id)
      if (!s) throw new Error("Населённый пункт не найден")
      return s
    }),
  getPickupPoints: (settlementId?: string) =>
    apiCall(() =>
      settlementId
        ? pickupPoints.filter((p) => p.settlementId === settlementId)
        : pickupPoints,
    ),
}
