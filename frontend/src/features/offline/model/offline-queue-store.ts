import { create } from "zustand"
import { persist } from "zustand/middleware"

export type OfflineActionStatus = "queued" | "processing" | "done" | "failed"

/** Зарезервировано для будущих офлайн-сценариев координатора */
export type OfflineActionType = never

export interface OfflineAction<TPayload = unknown> {
  id: string
  type: OfflineActionType
  payload: TPayload
  createdAt: string
  updatedAt: string
  status: OfflineActionStatus
  attempts: number
  lastError?: string
}

interface OfflineQueueState {
  actions: OfflineAction[]
  enqueue: <T>(action: Omit<OfflineAction<T>, "id" | "createdAt" | "updatedAt" | "status" | "attempts">) => string
  markProcessing: (id: string) => void
  markDone: (id: string) => void
  markFailed: (id: string, error: string) => void
  remove: (id: string) => void
  clearDone: () => void
  reset: () => void
}

function nowIso() {
  return new Date().toISOString()
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      actions: [],

      enqueue: (action) => {
        const id = newId("oa")
        const t = nowIso()
        const full: OfflineAction = {
          id,
          type: action.type,
          payload: action.payload,
          createdAt: t,
          updatedAt: t,
          status: "queued",
          attempts: 0,
        }
        set((s) => ({ actions: [full, ...s.actions] }))
        return id
      },

      markProcessing: (id) => {
        set((s) => ({
          actions: s.actions.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "processing",
                  attempts: a.attempts + 1,
                  updatedAt: nowIso(),
                  lastError: undefined,
                }
              : a,
          ),
        }))
      },

      markDone: (id) => {
        set((s) => ({
          actions: s.actions.map((a) =>
            a.id === id ? { ...a, status: "done", updatedAt: nowIso() } : a,
          ),
        }))
      },

      markFailed: (id, error) => {
        set((s) => ({
          actions: s.actions.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "failed",
                  updatedAt: nowIso(),
                  lastError: error,
                }
              : a,
          ),
        }))
      },

      remove: (id) =>
        set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),

      clearDone: () => {
        const { actions } = get()
        set({ actions: actions.filter((a) => a.status !== "done") })
      },

      reset: () => set({ actions: [] }),
    }),
    { name: "coop-offline-queue" },
  ),
)
