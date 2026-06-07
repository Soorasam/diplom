import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { getAccessToken } from "@/shared/api/auth-storage"
import { cartApi } from "@/entities/cart/api/cartApi"
import { useProducts } from "@/entities/product/api/useProducts"
import { mapBackendCartItems } from "@/features/cart/lib/map-backend-cart"
import { useCartStore } from "@/features/cart/model/cart-store"
import { queryKeys } from "@/shared/config/query-keys"


export const useCartSync = () => {
  const authHydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const setFromServer = useCartStore((s) => s.setFromServer)
  const pruneInvalidProducts = useCartStore((s) => s.pruneInvalidProducts)
  const setPickupPoint = useCartStore((s) => s.setPickupPoint)

  const { data: products } = useProducts()

  const hasToken = Boolean(getAccessToken())
  const shouldFetchCart = authHydrated && isAuthenticated && hasToken

  const { data: serverCart, isSuccess: cartLoaded } = useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => cartApi.get(),
    enabled: shouldFetchCart,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!authHydrated) return
    if (!shouldFetchCart) return
    if (!cartLoaded || !serverCart) return

    setFromServer(mapBackendCartItems(serverCart))
    const deliveryPointId = user?.pickupPointId ?? user?.settlementId
    if (deliveryPointId) {
      setPickupPoint(deliveryPointId)
    }
  }, [
    authHydrated,
    shouldFetchCart,
    cartLoaded,
    serverCart,
    setFromServer,
    setPickupPoint,
    user?.pickupPointId,
    user?.settlementId,
  ])

  useEffect(() => {
    if (!products?.length) return
    pruneInvalidProducts(products.map((p) => p.id))
  }, [products, pruneInvalidProducts])
}


export const useValidCartItemCount = () => {
  const items = useCartStore((s) => s.items)
  const { data: products } = useProducts()

  if (!products?.length) {
    return items.reduce((sum, i) => sum + i.quantity, 0)
  }

  const valid = new Set(products.map((p) => p.id))
  return items
    .filter((i) => valid.has(i.productId))
    .reduce((sum, i) => sum + i.quantity, 0)
}
