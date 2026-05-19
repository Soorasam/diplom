import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  pickupPointId: string | null
  procurementId: string | null
  comment: string
  addItem: (productId: string, qty?: number) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  setPickupPoint: (id: string) => void
  setProcurement: (id: string) => void
  setComment: (comment: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      pickupPointId: null,
      procurementId: "pr1",
      comment: "",

      addItem: (productId, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === productId)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            }
          }
          return { items: [...s.items, { productId, quantity: qty }] }
        }),

      removeItem: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        })),

      setPickupPoint: (id) => set({ pickupPointId: id }),
      setProcurement: (id) => set({ procurementId: id }),
      setComment: (comment) => set({ comment }),
      clear: () => set({ items: [], comment: "" }),
    }),
    { name: "coop-cart" },
  ),
)
