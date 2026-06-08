import { useQuery } from "@tanstack/react-query"

import { procurementChecklistApi } from "@/entities/driver-procurement/api/procurementChecklistApi"
import { useDriverWorkbench } from "@/shared/hooks/useDriverWorkbench"
import {
  buildDriverDashboardHero,
  buildRouteChain,
} from "@/shared/lib/driver-phase-hero"

export const useDriverPhaseHero = () => {
  const workbench = useDriverWorkbench()
  const {
    activeRoute,
    currentStop,
    workRoundId,
    isLoading,
    orders,
    activeRound,
    deliveryRound,
    hasOpenCollection,
  } = workbench

  const isProcurementPhase =
    Boolean(currentStop?.isProcurementStop) && !currentStop?.procurementCompleted

  const { data: checklistData } = useQuery({
    queryKey: ["driver", "procurement-checklist", workRoundId, "hero"],
    queryFn: () => procurementChecklistApi.getActive(workRoundId!),
    enabled: Boolean(workRoundId && isProcurementPhase),
  })

  const checklist = checklistData?.active ? checklistData : null

  const hero = buildDriverDashboardHero({
    orders,
    activeRound: activeRound ?? undefined,
    deliveryRound: deliveryRound ?? undefined,
    hasOpenCollection,
    activeRoute,
    currentStop,
    checklistItemCount: checklist?.items.length ?? 0,
    checklistPurchasedCount: checklist?.procurementCompleted
      ? (checklist?.items.length ?? 0)
      : 0,
  })

  const routeChain = buildRouteChain(activeRoute?.deliveryStops)

  return {
    ...workbench,
    hero,
    routeChain,
    isLoading,
  }
}
