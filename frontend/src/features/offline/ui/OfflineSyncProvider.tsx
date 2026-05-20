import { useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useNetworkEffect } from "@/features/offline/lib/network-effect"
import { createOfflineHandlers } from "@/features/offline/lib/offline-sync"
import { useNetworkStore } from "@/features/offline/model/network-store"
import { useOfflineQueueStore } from "@/features/offline/model/offline-queue-store"

export const OfflineSyncProvider = () => {
  useNetworkEffect()

  const qc = useQueryClient()
  const isOnline = useNetworkStore((s) => s.isOnline)

  const actions = useOfflineQueueStore((s) => s.actions)
  const markProcessing = useOfflineQueueStore((s) => s.markProcessing)
  const markDone = useOfflineQueueStore((s) => s.markDone)
  const markFailed = useOfflineQueueStore((s) => s.markFailed)

  const handlers = useMemo(() => createOfflineHandlers(qc), [qc])

  useEffect(() => {
    if (!isOnline) return

    const next = actions.find((a) => a.status === "queued" || a.status === "failed")
    if (!next) return

    let cancelled = false

    const run = async () => {
      try {
        markProcessing(next.id)
        const handler = handlers[next.type]
        if (!handler) throw new Error(`Нет обработчика для ${next.type}`)
        await handler(next)
        if (!cancelled) markDone(next.id)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Неизвестная ошибка"
        if (!cancelled) markFailed(next.id, msg)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [actions, handlers, isOnline, markDone, markFailed, markProcessing])

  return null
}

