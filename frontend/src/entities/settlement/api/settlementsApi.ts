import { http } from "@/shared/api/client"
import type { PickupPoint, Settlement } from "@/shared/api/api-types"
import { mapPickupPoint, mapSettlement } from "@/shared/api/mappers"

type LocationDto = {
  id: string
  name: string
  district?: string | null
  ulus?: string | null
  address?: string | null
  phone?: string | null
}

export const settlementsApi = {
  getAll: async () => {
    const items = await http.get<LocationDto[]>("/settlements")
    return items.map(mapSettlement)
  },

  getById: async (id: string) => {
    const items = await settlementsApi.getAll()
    const s = items.find((x) => x.id === id)
    if (!s) throw new Error("Населённый пункт не найден")
    return s
  },

  getPickupPoints: async (locationId?: string) => {
    const items = await http.get<LocationDto[]>("/pickup-points")
    const mapped = items.map(mapPickupPoint) as PickupPoint[]
    if (!locationId) return mapped
    return mapped.filter((p) => p.id === locationId || p.settlementId === locationId)
  },
}

export type { Settlement }
