import { useAuthStore } from "@/app/model/auth-store"
import {
  useMyProcurementMemberships,
  useProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useCartStore } from "@/features/cart/model/cart-store"

/** Выбранный сбор в корзине и статус вступления */
export const useProcurementParticipation = () => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const procurementId = useCartStore((s) => s.procurementId)

  const { data: procurement, isLoading: loadingProcurement } = useProcurement(
    procurementId ?? "",
  )
  const { data: joinedRoundIds = [], isLoading: loadingMemberships } =
    useMyProcurementMemberships(user?.id)

  const hasJoined =
    isAuthenticated && Boolean(procurementId && joinedRoundIds.includes(procurementId))
  const isRoundOpen = procurement?.status === "open"
  const roundClosed = procurement != null && procurement.status !== "open"
  const canCheckoutRound = hasJoined && isRoundOpen && Boolean(procurementId)

  return {
    procurementId,
    procurement,
    joinedRoundIds,
    hasJoined,
    isRoundOpen,
    roundClosed,
    canCheckoutRound,
    isAuthenticated,
    loading: loadingProcurement || loadingMemberships,
  }
}
