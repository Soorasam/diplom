import type { BackendCart } from "@/entities/cart/api/cartApi"
import type { CartItem } from "@/features/cart/model/cart-store"

export const mapBackendCartItems = (cart: BackendCart): CartItem[] =>
  cart.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    lineId: i.id,
  }))
