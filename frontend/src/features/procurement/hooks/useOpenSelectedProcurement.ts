import { useEffect } from "react"

import { useProcurement } from "@/entities/procurement/api/useProcurements"
import { useCartStore } from "@/features/cart/model/cart-store"


export const useOpenSelectedProcurement = (selectedRoundId: string) => {
  const clearProcurement = useCartStore((s) => s.clearProcurement)
  const { data: procurement, isLoading } = useProcurement(selectedRoundId)

  const openProcurement =
    procurement?.status === "open" ? procurement : undefined
  const closedProcurement =
    procurement && procurement.status !== "open" ? procurement : undefined

  useEffect(() => {
    if (!selectedRoundId || isLoading) return
    if (closedProcurement) {
      clearProcurement()
    }
  }, [selectedRoundId, isLoading, closedProcurement, clearProcurement])

  return {
    procurement: openProcurement,
    closedProcurement,
    isLoading: Boolean(selectedRoundId) && isLoading,
  }
}
