import { http } from "@/shared/api/client"
import type { BackendRound, BackendUser } from "@/shared/api/backend-types"
import type { Order, PickupPoint, Product, Settlement, User } from "@/shared/api/mock-db"
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

export type AdminDriverDetail = {
  id: string
  name: string
  phone: string
  email: string
  role: User["role"]
  settlementId: string
  pickupPointId: string | null
  createdAt: string
  settlement: { id: string; name: string; ulus?: string | null } | null
  application: {
    id: string
    status: string
    vehicleSummary: string | null
    rejectionReason: string | null
    submittedAt: string | null
    reviewedAt: string | null
    documents: {
      id: string
      type: string
      url: string
      fileName: string | null
      mimeType: string | null
    }[]
  } | null
}

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

  getSettlements: async () => {
    const list = await http.get<
      { id: string; name: string; district?: string | null; ulus?: string | null }[]
    >("/admin/settlements", true)
    return list.map(mapSettlement) as Settlement[]
  },

  createSettlement: (payload: {
    name: string
    ulus?: string
    district?: string
    address?: string
    phone?: string
  }) => http.post("/admin/settlements", payload, true),

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

  getDriver: async (id: string): Promise<AdminDriverDetail> => {
    const d = await http.get<{
      id: string
      email: string
      fullName: string | null
      phone: string | null
      role: BackendUser["role"]
      settlementId: string | null
      pickupPointId: string | null
      createdAt: string
      settlement: { id: string; name: string; ulus?: string | null } | null
      application: AdminDriverDetail["application"]
    }>(`/admin/drivers/${id}`, true)
    return {
      id: d.id,
      name: d.fullName ?? d.email,
      phone: d.phone ?? "",
      email: d.email,
      role: mapBackendRole(d.role),
      settlementId: d.settlementId ?? "",
      pickupPointId: d.pickupPointId,
      createdAt: d.createdAt,
      settlement: d.settlement,
      application: d.application,
    }
  },

  getPickupPoints: async (): Promise<AdminPickupPoint[]> => {
    const list = await http.get<
      {
        id: string
        name: string
        address?: string | null
        phone?: string | null
        ulus?: string | null
        users?: { id: string; email: string; fullName: string | null; phone: string | null }[]
      }[]
    >("/admin/pickup-points", true)
    return list.map((p) => ({
      ...mapPickupPoint({ ...p, settlementId: p.id }),
      settlementName: p.name,
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
