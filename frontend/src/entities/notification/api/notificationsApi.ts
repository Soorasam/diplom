import { http } from "@/shared/api/client"
import type { Notification } from "@/shared/api/mock-db"

export const notificationsApi = {
  getByUser: async (_userId: string) => {
    const list = await http.get<Notification[]>("/notifications", true)
    return list.map((n) => ({
      ...n,
      createdAt: typeof n.createdAt === "string" ? n.createdAt : String(n.createdAt),
    }))
  },

  markRead: (id: string) => http.patch<Notification>(`/notifications/${id}/read`, undefined, true),

  getDisputes: async () => {
    const list = await http.get<Notification[]>("/notifications/disputes", true)
    return list.map((n) => ({
      ...n,
      createdAt: typeof n.createdAt === "string" ? n.createdAt : String(n.createdAt),
    }))
  },

  createDispute: (payload: { orderId: string; message: string }) =>
    http.post<Notification>("/notifications/disputes", payload, true),
}
