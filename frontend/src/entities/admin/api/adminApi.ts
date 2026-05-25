import { http } from "@/shared/api/client"
import type { BackendRound, BackendUser } from "@/shared/api/backend-types"
import type { DeliveryRoute, Order, PickupPoint, Product, Settlement, User } from "@/shared/api/mock-db"
import {
  mapBackendOrder,
  mapBackendRole,
  mapPickupPoint,
  mapProduct,
  mapRound,
  mapSettlement,
  mapFrontOrderStatusToBackend,
} from "@/shared/api/mappers"
import type { BackendProduct } from "@/shared/api/backend-types"
import type { OrderStatus } from "@/shared/types"

export type AdminStats = {
  ordersToday: number
  revenue: number
  revenueMonth: number
  activeUsers: number
  participants: number
  productsCount: number
  routesCount: number
  settlementsCount: number
  settlements: number
  driversCount: number
  driversActive: number
  activeProcurements: number
  procurementsOpen: number
}

export type AdminPickupPoint = PickupPoint & {
  settlementName?: string
  employees: { id: string; name: string; email: string; phone: string }[]
}

export type AdminRouteRow = {
  id: string
  title: string
  transportType: string
  description?: string | null
  seasonNote?: string | null
}

export type CreateRoutePayload = {
  title: string
  description?: string
  transportType: "winter_road" | "river" | "highway"
  seasonNote?: string
}

const mapAdminRoute = (r: AdminRouteRow): DeliveryRoute & {
  description?: string | null
  seasonNote?: string | null
  transportType: string
} => ({
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
  status: "planned",
  points: [],
  description: r.description,
  seasonNote: r.seasonNote,
  transportType: r.transportType,
})

export type AdminTicket = {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  kind: "dispute" | "other"
  reporterName: string | null
}

export const adminApi = {
  getStats: () => http.get<AdminStats>("/admin/stats", true),

  getUsers: async () => {
    const list = await http.get<BackendUser[]>("/admin/users", true)
    return list.map(
      (u): User => ({
        id: u.id,
        name: u.fullName ?? u.email,
        phone: u.phone ?? "",
        email: u.email,
        role: mapBackendRole(u.role),
        settlementId: u.settlementId ?? "",
      }),
    )
  },

  getOrders: async () => {
    const list = await http.get<Parameters<typeof mapBackendOrder>[0][]>("/admin/orders", true)
    return list.map(mapBackendOrder) as Order[]
  },

  getProducts: async () => {
    const list = await http.get<BackendProduct[]>("/admin/products", true)
    return list.map(mapProduct) as Product[]
  },

  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    http.patch(
      `/admin/orders/${orderId}/status`,
      { status: mapFrontOrderStatusToBackend(status) },
      true,
    ),

  getRoutes: async () => {
    const list = await http.get<AdminRouteRow[]>("/admin/routes", true)
    return list.map(mapAdminRoute)
  },

  createRoute: (payload: CreateRoutePayload) =>
    http.post<AdminRouteRow>("/admin/routes", payload, true).then(mapAdminRoute),

  getSettlements: async () => {
    const list = await http.get<
      { id: string; name: string; district?: string | null; ulus?: string | null }[]
    >("/admin/settlements", true)
    return list.map(mapSettlement) as Settlement[]
  },

  getDrivers: async () => {
    const list = await http.get<BackendUser[]>("/admin/drivers", true)
    return list.map(
      (u): User => ({
        id: u.id,
        name: u.fullName ?? u.email,
        phone: u.phone ?? "",
        email: u.email,
        role: mapBackendRole(u.role),
        settlementId: u.settlementId ?? "",
      }),
    )
  },

  getPickupPoints: async (): Promise<AdminPickupPoint[]> => {
    const list = await http.get<
      {
        id: string
        settlementId: string
        coordinatorName: string
        address?: string | null
        phone?: string | null
        settlement?: { id: string; name: string; ulus?: string | null }
        users?: { id: string; email: string; fullName: string | null; phone: string | null }[]
      }[]
    >("/admin/pickup-points", true)
    return list.map((p) => ({
      ...mapPickupPoint(p),
      settlementName: p.settlement?.name,
      employees: (p.users ?? []).map((u) => ({
        id: u.id,
        name: u.fullName ?? u.email,
        email: u.email,
        phone: u.phone ?? "",
      })),
    }))
  },

  getRounds: async () => {
    const list = await http.get<BackendRound[]>("/admin/rounds", true)
    return list.map(mapRound)
  },

  fulfillRound: (id: string) =>
    http.patch<BackendRound>(`/rounds/${id}/fulfill`, {}, true).then(mapRound),

  closeAndDispatchRound: (id: string) =>
    http.patch<BackendRound>(`/rounds/${id}/close`, {}, true).then(mapRound),

  getNotifications: async (): Promise<AdminTicket[]> => {
    return http.get<AdminTicket[]>("/admin/notifications", true)
  },

  resolveNotification: (id: string) => http.patch(`/admin/notifications/${id}/resolve`, {}, true),

  createPvzEmployee: (payload: {
    email: string
    pickupPointId: string
    fullName?: string
  }) =>
    http.post<{
      user: {
        id: string
        email: string
        fullName: string | null
        pickupPointId: string | null
      }
      temporaryPassword: string
      pickupPoint: { id: string; name: string; settlementName: string }
    }>("/admin/pvz-employees", payload, true),
}
