import type { OfflineAction } from "@/features/offline/model/offline-queue-store"
import type { QueryClient } from "@tanstack/react-query"

type ActionHandler = (a: OfflineAction) => Promise<void>

export function createOfflineHandlers(_qc: QueryClient): Record<string, ActionHandler> {
  return {}
}
