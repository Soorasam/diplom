import type { CartItem } from "@/features/cart/model/cart-store"

export const cartHasItems = (items: CartItem[]) => items.length > 0

export const getCheckoutRoundId = (procurementId: string | null): string | null =>
  procurementId
