import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { notificationsApi } from "./notificationsApi"

export const useNotifications = (userId?: string) =>
  useQuery({
    queryKey: queryKeys.notifications(userId ?? ""),
    queryFn: () => notificationsApi.getByUser(userId!),
    enabled: Boolean(userId),
  })

export const useMarkNotificationRead = (userId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications(userId) })
    },
  })
}
