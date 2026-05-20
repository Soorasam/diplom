import type { ProductFilters } from "@/entities/product/api/productsApi"

/** Ключи TanStack Query — предотвращают опечатки и упрощают инвалидацию */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters?: ProductFilters) => ["products", "list", filters] as const,
    detail: (id: string) => ["products", id] as const,
  },
  procurements: {
    all: ["procurements"] as const,
    active: ["procurements", "active"] as const,
    memberships: (userId?: string) => ["procurements", "memberships", userId] as const,
  },
  cart: ["cart"] as const,
  orders: {
    all: ["orders"] as const,
    list: (userId?: string) => ["orders", "list", userId] as const,
    detail: (id: string) => ["orders", id] as const,
  },
  settlements: ["settlements"] as const,
  pickupPoints: (settlementId?: string) =>
    ["pickup-points", settlementId] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  routes: {
    all: ["routes"] as const,
    driver: (driverId: string) => ["routes", "driver", driverId] as const,
  },
  employee: {
    orders: (pickupPointId: string) =>
      ["employee", "orders", pickupPointId] as const,
  },
  admin: {
    stats: ["admin", "stats"] as const,
    users: ["admin", "users"] as const,
    drivers: ["admin", "drivers"] as const,
  },
} as const
