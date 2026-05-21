import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { cartApi } from "@/entities/cart/api/cartApi"
import { mapBackendCartItems } from "@/features/cart/lib/map-backend-cart"
import { useCartStore } from "@/features/cart/model/cart-store"
import { queryKeys } from "@/shared/config/query-keys"

export const useCartActions = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const qc = useQueryClient()
  const setFromServer = useCartStore((s) => s.setFromServer)
  const localAdd = useCartStore((s) => s.addItem)
  const localRemove = useCartStore((s) => s.removeItem)
  const localSetQty = useCartStore((s) => s.setQuantity)
  const localClear = useCartStore((s) => s.clear)

  const applyServerCart = useCallback(
    async (cart: Awaited<ReturnType<typeof cartApi.get>>) => {
      setFromServer(mapBackendCartItems(cart), cart.round?.id ?? null)
      await qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
    [setFromServer, qc],
  )

  const addItem = useCallback(
    async (productId: string, qty = 1) => {
      const roundId = useCartStore.getState().procurementId ?? undefined
      if (!isAuthenticated) {
        localAdd(productId, qty)
        return
      }
      const cart = await cartApi.addItem(productId, qty, roundId)
      await applyServerCart(cart)
    },
    [isAuthenticated, localAdd, applyServerCart],
  )

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const line = useCartStore.getState().items.find((i) => i.productId === productId)
      if (!isAuthenticated || !line?.lineId) {
        localSetQty(productId, quantity)
        return
      }
      if (quantity <= 0) {
        const cart = await cartApi.removeItem(line.lineId)
        await applyServerCart(cart)
        return
      }
      const cart = await cartApi.updateItem(line.lineId, quantity)
      await applyServerCart(cart)
    },
    [isAuthenticated, localSetQty, applyServerCart],
  )

  const removeItem = useCallback(
    async (productId: string) => {
      const line = useCartStore.getState().items.find((i) => i.productId === productId)
      if (!isAuthenticated || !line?.lineId) {
        localRemove(productId)
        return
      }
      const cart = await cartApi.removeItem(line.lineId)
      await applyServerCart(cart)
    },
    [isAuthenticated, localRemove, applyServerCart],
  )

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      const cart = await cartApi.clear()
      await applyServerCart(cart)
    }
    localClear()
  }, [isAuthenticated, localClear, applyServerCart])

  return { addItem, setQuantity, removeItem, clearCart }
}
