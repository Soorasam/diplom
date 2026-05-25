import { useCartStore } from "@/features/cart/model/cart-store"
import { cartHasItems, getCheckoutRoundId } from "@/features/cart/lib/cart-round"

export const useCartBoundRound = () => {
  const items = useCartStore((s) => s.items)
  const procurementId = useCartStore((s) => s.procurementId)
  const checkoutRoundId = getCheckoutRoundId(procurementId)

  return {
    items,
    procurementId,
    boundRoundId: checkoutRoundId,
    hasItems: cartHasItems(items),
    canSwitchTo: () => true,
  }
}
