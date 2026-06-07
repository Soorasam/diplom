import { http } from "@/shared/api/client"
import type { Settlement } from "@/shared/api/api-types"
import { mapSettlement } from "@/shared/api/mappers"

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
}

export type { Settlement }
