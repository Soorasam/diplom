import { http } from "@/shared/api/client"
import type { BackendRound } from "@/shared/api/backend-types"
import { mapRound } from "@/shared/api/mappers"
import type { DeliveryMode, UserRole } from "@/shared/types"

export const procurementsApi = {
  getActive: async () => {
    const rounds = await http.get<BackendRound[]>("/rounds?status=open")
    return rounds.map(mapRound)
  },

  getAll: async () => {
    const rounds = await http.get<BackendRound[]>("/rounds")
    return rounds.map(mapRound)
  },

  getById: async (id: string) => {
    const round = await http.get<BackendRound>(`/rounds/${id}`)
    return mapRound(round)
  },

  create: async (payload: {
    title: string
    closesAt: string
    deliveryMode: DeliveryMode
    templateRouteId?: string
    routePlan?: {
      title: string
      transportType: "winter_road" | "river" | "highway"
      waypoints: { pickupPointId: string; sortOrder: number; isProcurementPoint: boolean }[]
      isTemplate?: boolean
    }
  }) => {
    const body: Record<string, unknown> = {
      title: payload.title,
      closesAt: payload.closesAt,
    }
    if (payload.templateRouteId) body.templateRouteId = payload.templateRouteId
    else if (payload.routePlan) body.routePlan = payload.routePlan

    const round = await http.post<BackendRound>("/rounds", body, true)
    return mapRound(round)
  },

  getDriverActive: async () => {
    const round = await http.get<BackendRound | null>("/driver/rounds/active", true)
    return round ? mapRound(round) : null
  },

  getDriverDelivery: async () => {
    const round = await http.get<BackendRound | null>("/driver/rounds/delivery", true)
    return round ? mapRound(round) : null
  },

  scheduleEmergencyClose: async (id: string) => {
    const round = await http.post<BackendRound>(`/rounds/${id}/emergency-close`, {}, true)
    return mapRound(round)
  },

  close: async (id: string, actorRole: UserRole) => {
    if (actorRole !== "admin") {
      throw new Error("Немедленно закрыть сбор может только администратор")
    }
    await http.patch(`/rounds/${id}/close`, {}, true)
    return procurementsApi.getById(id)
  },

  getMemberships: async (_userId: string) => {
    return http.get<string[]>("/rounds/memberships/me", true)
  },

  join: async (_userId: string, procurementId: string) => {
    const res = await http.post<{ roundIds: string[] }>(
      `/rounds/${procurementId}/join`,
      {},
      true,
    )
    return res.roundIds
  },

  leave: async (_userId: string, procurementId: string) => {
    const res = await http.post<{ roundIds: string[] }>(
      `/rounds/${procurementId}/leave`,
      {},
      true,
    )
    return res.roundIds
  },
}
