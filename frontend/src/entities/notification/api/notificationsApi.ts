import { apiCall } from "@/shared/api/client"
import { notifications } from "@/shared/api/mock-db"

let store = [...notifications]

export const notificationsApi = {
  getByUser: (userId: string) =>
    apiCall(() => store.filter((n) => n.userId === userId)),

  markRead: (id: string) =>
    apiCall(() => {
      store = store.map((n) => (n.id === id ? { ...n, read: true } : n))
    }),
}
