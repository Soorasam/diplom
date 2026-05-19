import { apiCall } from "@/shared/api/client"
import {
  adminStats,
  deliveryRoutes,
  orders,
  products,
  settlements,
  users,
} from "@/shared/api/mock-db"

const drivers = () => users.filter((u) => u.role === "driver")

export const adminApi = {
  getStats: () => apiCall(() => adminStats),
  getUsers: () => apiCall(() => users),
  getOrders: () => apiCall(() => orders),
  getProducts: () => apiCall(() => products),
  getRoutes: () => apiCall(() => deliveryRoutes),
  getSettlements: () => apiCall(() => settlements),
  getDrivers: () => apiCall(() => drivers()),
}
