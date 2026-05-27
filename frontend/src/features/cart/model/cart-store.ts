import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  quantity: number
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
  setFromServer: (items: CartItem[]) => void
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
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        }))
      },

      setQuantity: (productId, quantity) => {
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        }))
      },

      setPickupPoint: (id) => set({ pickupPointId: id }),
      setProcurement: (id) => set({ procurementId: id }),
      clearProcurement: () => set({ procurementId: null }),
      setComment: (comment) => set({ comment }),

      setFromServer: (items) => {
        set((s) => {
          const serverIds = new Set(items.map((i) => i.productId))
          const draftOnly = s.items.filter(
            (i) => !i.lineId && !serverIds.has(i.productId),
          )
          return {
            items: [...items, ...draftOnly],
            procurementId: s.procurementId,
          }
        })
      },

      pruneInvalidProducts: (validProductIds) => {
        const valid = new Set(validProductIds)
        set((s) => {
          const next = s.items.filter((i) => valid.has(i.productId))
          if (next.length === s.items.length) return s
          return { items: next }
        })
      },

      clear: () => set({ items: [], comment: "" }),

      reset: () => set({ ...emptyState }),
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
