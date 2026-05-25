import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { ticketsApi } from "@/entities/ticket/api/ticketsApi"
import { queryKeys } from "@/shared/config/query-keys"

import { notificationsApi } from "./notificationsApi"

export const useNotifications = (userId?: string) =>
  useQuery({
    queryKey: queryKeys.notifications(userId ?? ""),
    queryFn: () => notificationsApi.getByUser(userId!),
    enabled: Boolean(userId),
    refetchOnMount: "always",
  })

export const useUnreadNotificationsCount = () => {
  const userId = useAuthStore((s) => s.user?.id)
  const { data } = useNotifications(userId)
  return data?.filter((n) => !n.read).length ?? 0
}

export const useMarkNotificationRead = (userId: string) => {
  const qc = useQueryClient()
  const key = queryKeys.notifications(userId)

  return useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Awaited<ReturnType<typeof notificationsApi.getByUser>>>(key)
      if (prev) {
        qc.setQueryData(
          key,
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        )
      }
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key })
      void qc.invalidateQueries({ queryKey: queryKeys.tickets.list })
    },
  })
}

export const useMarkAllNotificationsRead = (userId: string | undefined) => {
  const qc = useQueryClient()
  const key = queryKeys.notifications(userId ?? "")

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Awaited<ReturnType<typeof notificationsApi.getByUser>>>(key)
      if (prev) {
        qc.setQueryData(
          key,
          prev.map((n) => ({ ...n, read: true })),
        )
      }
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key })
    },
  })
}

/** Пометить все прочитанными при открытии экрана уведомлений */
export const useAutoMarkNotificationsRead = (
  userId: string | undefined,
  enabled: boolean,
) => {
  const { data, isSuccess } = useNotifications(userId)
  const markAll = useMarkAllNotificationsRead(userId)
  const didRun = useRef(false)

  useEffect(() => {
    if (!enabled) {
      didRun.current = false
      return
    }
    if (!userId || !isSuccess || didRun.current) return
    if (!data?.some((n) => !n.read)) return
    didRun.current = true
    markAll.mutate()
  }, [enabled, userId, isSuccess, data])
}

/** @deprecated use useMyTickets from entities/ticket */
export const useMyDisputes = (userId?: string) =>
  useQuery({
    queryKey: queryKeys.tickets.list,
    queryFn: () => ticketsApi.list(),
    enabled: Boolean(userId),
  })
