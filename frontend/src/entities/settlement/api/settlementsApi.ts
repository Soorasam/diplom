import { http } from "@/shared/api/client"
import type { PickupPoint, Settlement } from "@/shared/api/mock-db"
import { mapPickupPoint, mapSettlement } from "@/shared/api/mappers"

export const settlementsApi = {
  getAll: async () => {
    const items = await http.get<{ id: string; name: string; district?: string; ulus?: string }[]>(
      "/settlements",
    )
    return items.map(mapSettlement)
  },

  getById: async (id: string) => {
    const items = await settlementsApi.getAll()
    const s = items.find((x) => x.id === id)
    if (!s) throw new Error("Населённый пункт не найден")
    return s
  },

  getPickupPoints: async (settlementId?: string) => {
    const query = settlementId ? `?settlement_id=${settlementId}` : ""
    const items = await http.get<
      {
        id: string
        settlementId: string
        coordinatorName: string
        address?: string
        phone?: string
      }[]
    >(`/pickup-points${query}`)
    return items.map(mapPickupPoint) as PickupPoint[]
  },
}

export type { Settlement }
