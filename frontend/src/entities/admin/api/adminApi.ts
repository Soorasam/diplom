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

export type AdminTicket = {
  id: string
  userId: string
  userName: string
  userEmail: string
  title: string
  body: string
  read: boolean
  createdAt: string
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
    const list = await http.get<
      {
        id: string
        title: string
        transportType: string
        description?: string | null
      }[]
    >("/admin/routes", true)
    return list.map(
      (r): DeliveryRoute => ({
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
        status: "active",
        points: [],
      }),
    )
  },

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

  getNotifications: async (): Promise<AdminTicket[]> => {
    const list = await http.get<
      {
        id: string
        userId: string
        title: string
        body: string
        read: boolean
        createdAt: string
        user?: { id: string; email: string; fullName: string | null; phone: string | null }
      }[]
    >("/admin/notifications", true)
    return list.map((n) => ({
      id: n.id,
      userId: n.userId,
      userName: n.user?.fullName ?? n.user?.email ?? n.userId,
      userEmail: n.user?.email ?? "",
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    }))
  },
}
