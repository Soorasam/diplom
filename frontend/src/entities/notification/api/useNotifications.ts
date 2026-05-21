import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { queryKeys } from "@/shared/config/query-keys"

import { notificationsApi } from "./notificationsApi"

export const useNotifications = (userId?: string) =>
  useQuery({
    queryKey: queryKeys.notifications(userId ?? ""),
    queryFn: () => notificationsApi.getByUser(userId!),
    enabled: Boolean(userId),
  })

export const useUnreadNotificationsCount = () => {
  const userId = useAuthStore((s) => s.user?.id)
  const { data } = useNotifications(userId)
  return data?.filter((n) => !n.read).length ?? 0
}

export const useMarkNotificationRead = (userId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications(userId) })
    },
  })
}
