import { http } from "@/shared/api/client"

export interface BackendCartItem {
  id: string
  productId: string
  quantity: number
  product: { id: string; name: string; priceEstimate: number; unit: string }
  lineTotal: number
}

export interface BackendCart {
  items: BackendCartItem[]
  itemsCount: number
  totalEstimate: number
  round: { id: string } | null
}

export const cartApi = {
  get: () => http.get<BackendCart>("/cart", true),

  addItem: (productId: string, quantity = 1, roundId: string) =>
    http.post<BackendCart>(
      "/cart/items",
      { productId, quantity, roundId },
      true,
    ),

  updateItem: (itemId: string, quantity: number) =>
    http.patch<BackendCart>(`/cart/items/${itemId}`, { quantity }, true),

  removeItem: (itemId: string) => http.delete<BackendCart>(`/cart/items/${itemId}`, true),

  clear: () => http.delete<BackendCart>("/cart", true),

  checkout: (roundId?: string) =>
    http.post<{ id: string; publicNumber: string }>(
      "/cart/checkout",
      roundId ? { roundId } : {},
      true,
    ),
}
