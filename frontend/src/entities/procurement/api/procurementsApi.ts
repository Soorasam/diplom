import { apiCall } from "@/shared/api/client"
import { deliveryRoutes, procurements } from "@/shared/api/mock-db"
import type { DeliveryMode, ProcurementStatus, UserRole } from "@/shared/types"

let store = [...procurements]
let membershipsStore: Record<string, string[]> = {
  u1: ["pr1"],
}
let receiptApprovalsStore: Record<string, { approvedByRole: "employee" | "admin"; approvedAt: string }[]> = {}

export const procurementsApi = {
  getActive: () =>
    apiCall(() =>
      store.filter((p) => p.status === "open" || p.status === "closing"),
    ),

  getAll: () => apiCall(() => store),

  getById: (id: string) =>
    apiCall(() => {
      const item = store.find((p) => p.id === id)
      if (!item) throw new Error("Сбор не найден")
      return item
    }),

  getRoute: (routeId: string) =>
    apiCall(() => deliveryRoutes.find((r) => r.id === routeId)),

  create: (payload: {
    title: string
    routeId: string
    closesAt: string
    deliveryMode: DeliveryMode
  }) =>
    apiCall(() => {
      const item = {
        id: `pr-${Date.now()}`,
        title: payload.title,
        routeId: payload.routeId,
        status: "open" as ProcurementStatus,
        closesAt: payload.closesAt,
        minVolumePercent: 100,
        currentVolumePercent: 0,
        deliveryMode: payload.deliveryMode,
        estimatedDelivery: payload.closesAt,
      }
      store = [item, ...store]
      return item
    }),

  close: (id: string, actorRole: UserRole) =>
    apiCall(() => {
      if (actorRole !== "driver") {
        throw new Error("Закрывать сбор может только водитель")
      }
      store = store.map((p) =>
        p.id === id ? { ...p, status: "closed" as ProcurementStatus } : p,
      )
      const item = store.find((p) => p.id === id)
      if (!item) throw new Error("Сбор не найден")
      return item
    }),

  getMemberships: (userId: string) =>
    apiCall(() => membershipsStore[userId] ?? []),

  join: (userId: string, procurementId: string) =>
    apiCall(() => {
      const target = store.find((p) => p.id === procurementId)
      if (!target) throw new Error("Сбор не найден")
      if (target.status !== "open" && target.status !== "closing") {
        throw new Error("Нельзя присоединиться к закрытому сбору")
      }

      const existing = membershipsStore[userId] ?? []
      if (existing.includes(procurementId)) return existing

      membershipsStore = {
        ...membershipsStore,
        [userId]: [procurementId, ...existing],
      }

      return membershipsStore[userId]
    }),

  getReceiptApprovals: (procurementId: string) =>
    apiCall(() => receiptApprovalsStore[procurementId] ?? []),

  approveReceipt: (procurementId: string, actorRole: UserRole) =>
    apiCall(() => {
      if (actorRole !== "employee" && actorRole !== "admin") {
        throw new Error("Подтверждать приемку может только ПВЗ или админ")
      }

      const existing = receiptApprovalsStore[procurementId] ?? []
      if (existing.some((x) => x.approvedByRole === actorRole)) {
        return existing
      }

      const next = [
        ...existing,
        { approvedByRole: actorRole, approvedAt: new Date().toISOString() },
      ]
      receiptApprovalsStore = { ...receiptApprovalsStore, [procurementId]: next }
      return next
    }),
}
