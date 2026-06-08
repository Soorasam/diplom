import { useAuthStore } from "@/app/model/auth-store"
import { useDriverPhaseHero } from "@/shared/hooks/useDriverPhaseHero"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { DriverPhaseHero } from "@/widgets/driver-phase-hero/ui/DriverPhaseHero"
import { DriverDashboardTiles } from "@/widgets/driver-dashboard-tiles/ui/DriverDashboardTiles"
import { DriverRouteChain } from "@/widgets/driver-route-chain/ui/DriverRouteChain"

export const DriverDashboardPage = () => {
  const user = useAuthStore((s) => s.user)
  const {
    isLoading,
    orders,
    awaitingAcceptCount,
    activeRound,
    hasOpenCollection,
    hero,
    routeChain,
  } = useDriverPhaseHero()

  const inTransitCount = orders.filter(
    (o) => o.status === "in_transit" || o.status === "at_pickup",
  ).length

  const activeOrdersCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  ).length

  return (
    <PageShell>
      <PageHeader title="Сводка" subtitle={user?.name ?? "Водитель"} />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <DriverPhaseHero hero={hero} />
          <DriverRouteChain chain={routeChain} />
          <DriverDashboardTiles
            awaitingAcceptCount={awaitingAcceptCount}
            inTransitCount={inTransitCount}
            totalOrdersCount={activeOrdersCount}
            participantsCount={
              hasOpenCollection && activeRound
                ? activeRound.participantsCount
                : undefined
            }
          />
        </div>
      )}
    </PageShell>
  )
}
