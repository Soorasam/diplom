import { create } from "zustand"
import { persist } from "zustand/middleware"

import { logEvent } from "@/shared/lib/event-log"

export interface CartItem {
  productId: string
  quantity: number
  /** id строки корзины на бэкенде */
  lineId?: string
}

interface CartState {
  items: CartItem[]
  pickupPointId: string | null
  procurementId: string | null
  comment: string
  addItem: (productId: string, qty?: number, lineId?: string) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  setPickupPoint: (id: string) => void
  setProcurement: (id: string) => void
  clearProcurement: () => void
  setComment: (comment: string) => void
  setFromServer: (items: CartItem[], procurementId?: string | null) => void
  pruneInvalidProducts: (validProductIds: string[]) => void
  clear: () => void
  reset: () => void
}

const emptyState = {
  items: [] as CartItem[],
  pickupPointId: null as string | null,
  procurementId: null as string | null,
  comment: "",
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      ...emptyState,

      addItem: (productId, qty = 1, lineId) => {
        logEvent("cart:addItem", { productId, qty })
        set((s) => {
          const existing = s.items.find((i) => i.productId === productId)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + qty, lineId: lineId ?? i.lineId }
                  : i,
              ),
            }
          }
          return { items: [...s.items, { productId, quantity: qty, lineId }] }
        })
      },

      removeItem: (productId) => {
        logEvent("cart:removeItem", { productId })
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        }))
      },

      setQuantity: (productId, quantity) => {
        logEvent("cart:setQuantity", { productId, quantity })
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        }))
      },

      setPickupPoint: (id) => {
        logEvent("cart:setPickupPoint", { pickupPointId: id })
        set({ pickupPointId: id })
      },
      setProcurement: (id) => {
        logEvent("cart:setProcurement", { procurementId: id })
        set({ procurementId: id })
      },
      clearProcurement: () => {
        logEvent("cart:clearProcurement")
        set({ procurementId: null })
      },
      setComment: (comment) => {
        logEvent("cart:setComment", { comment })
        set({ comment })
      },

      setFromServer: (items, procurementId) => {
        logEvent("cart:syncFromServer", { count: items.length })
        set((s) => {
          const serverIds = new Set(items.map((i) => i.productId))
          const draftOnly = s.items.filter(
            (i) => !i.lineId && !serverIds.has(i.productId),
          )
          return {
            items: [...items, ...draftOnly],
            procurementId:
              procurementId != null && procurementId !== ""
                ? procurementId
                : s.procurementId,
          }
        })
      },

      pruneInvalidProducts: (validProductIds) => {
        const valid = new Set(validProductIds)
        set((s) => {
          const next = s.items.filter((i) => valid.has(i.productId))
          if (next.length === s.items.length) return s
          logEvent("cart:pruneInvalid", {
            removed: s.items.length - next.length,
          })
          return { items: next }
        })
      },

      clear: () => {
        logEvent("cart:clear")
        set({ items: [], comment: "" })
      },

      reset: () => {
        logEvent("cart:reset")
        set({ ...emptyState })
      },
    }),
    {
      name: "coop-cart",
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          return { ...emptyState }
        }
        const state = persisted as Partial<CartState>
        return {
          ...emptyState,
          items: state.items ?? [],
          pickupPointId: state.pickupPointId ?? null,
          procurementId:
            state.procurementId === "pr1" ? null : (state.procurementId ?? null),
          comment: state.comment ?? "",
        }
      },
      partialize: (state) => ({
        items: state.items,
        pickupPointId: state.pickupPointId,
        procurementId: state.procurementId,
        comment: state.comment,
      }),
    },
  ),
)
