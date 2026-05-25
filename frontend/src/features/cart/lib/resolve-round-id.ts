import type { QueryClient } from "@tanstack/react-query"

import type { BackendCart } from "@/entities/cart/api/cartApi"
import { useCartStore } from "@/features/cart/model/cart-store"
import { queryKeys } from "@/shared/config/query-keys"

export const readRoundIdFromUrl = (): string | undefined => {
  if (typeof window === "undefined") return undefined
  return new URLSearchParams(window.location.search).get("round") ?? undefined
}


export const resolveRoundIdForCart = (queryClient?: QueryClient): string | undefined => {
  const fromStore = useCartStore.getState().procurementId
  if (fromStore) return fromStore

  const fromUrl = readRoundIdFromUrl()
  if (fromUrl) {
    useCartStore.getState().setProcurement(fromUrl)
    return fromUrl
  }

  if (queryClient) {
    const cart = queryClient.getQueryData<BackendCart>(queryKeys.cart)
    const fromServer = cart?.round?.id
    if (fromServer) {
      useCartStore.getState().setProcurement(fromServer)
      return fromServer
    }
  }

  return undefined
}
