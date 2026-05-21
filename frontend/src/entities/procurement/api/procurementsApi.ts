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

  getRoute: async (routeId: string) => {
    const routes = await http.get<{ id: string; title: string; transportType: string }[]>(
      "/routes",
    )
    const r = routes.find((x) => x.id === routeId)
    if (!r) throw new Error("Маршрут не найден")
    return {
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
      status: "active" as const,
      points: [],
    }
  },

  create: async (payload: {
    title: string
    routeId: string
    closesAt: string
    deliveryMode: DeliveryMode
  }) => {
    const round = await http.post<BackendRound>(
      "/rounds",
      {
        routeId: payload.routeId,
        title: payload.title,
        closesAt: payload.closesAt,
      },
      true,
    )
    return mapRound(round)
  },

  close: async (id: string, actorRole: UserRole) => {
    if (actorRole !== "driver" && actorRole !== "admin") {
      throw new Error("Закрывать сбор может только водитель или админ")
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

  getReceiptApprovals: async (procurementId: string) => {
    const round = await http.get<BackendRound>(`/rounds/${procurementId}`)
    if (round.status === "fulfilled") {
      return [{ approvedByRole: "admin" as const, approvedAt: round.closesAt }]
    }
    return []
  },

  approveReceipt: async (procurementId: string, actorRole: UserRole) => {
    if (actorRole !== "employee" && actorRole !== "admin") {
      throw new Error("Подтверждать приемку может только ПВЗ или админ")
    }
    await http.patch(`/rounds/${procurementId}/fulfill`, {}, true)
    return [{ approvedByRole: actorRole, approvedAt: new Date().toISOString() }]
  },
}
