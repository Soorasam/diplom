import { Package } from "lucide-react"

import { ProcurementChecklistCard } from "@/features/driver-procurement-checklist/ui/ProcurementChecklistCard"
import { useDriverWorkbench } from "@/shared/hooks/useDriverWorkbench"
import { buildOrdersPageHero } from "@/shared/lib/driver-phase-hero"
import { isAwaitingTripAccept } from "@/shared/lib/driver-orders"
import { isDriverProcurementStop } from "@/shared/lib/driver-route-stops"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { DriverPhaseHero } from "@/widgets/driver-phase-hero/ui/DriverPhaseHero"
import { DriverRouteChain } from "@/widgets/driver-route-chain/ui/DriverRouteChain"
import { DriverSettlementSection } from "@/widgets/driver-settlement-section/ui/DriverSettlementSection"
import { DriverSettlementResidents } from "@/widgets/driver-settlement-residents/ui/DriverSettlementResidents"

export const DriverOrdersPage = () => {
  const {
    isLoading,
    orders,
    awaitingAccept,
    settlementBlocks,
    activeRoute,
    workRoundId,
    hasOpenCollection,
    awaitingAcceptCount,
    currentStop,
  } = useDriverWorkbench()

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      </PageShell>
    )
  }

  const inTransitCount = orders.filter(
    (o) => o.status === "in_transit" || o.status === "at_pickup",
  ).length

  const routeChain =
    activeRoute?.deliveryStops?.map((s) => s.label).join(" → ") ?? ""

  const hero = buildOrdersPageHero({
    orders,
    awaitingAcceptCount,
    inTransitCount,
    settlementCount: settlementBlocks.length,
  })

  const showChecklist =
    Boolean(workRoundId && activeRoute) && isDriverProcurementStop(currentStop)
  const hasAnyOrders = orders.length > 0

  return (
    <PageShell>
      <PageHeader title="Заказы" subtitle="По посёлкам в порядке маршрута" />

      <div className="flex flex-col gap-4">
        <DriverPhaseHero hero={hero} hideFooter />
        <DriverRouteChain chain={routeChain} />

        {awaitingAccept.length > 0 ? (
          <DriverSettlementSection
            index={0}
            label="К принятию в рейс"
            meta={`${awaitingAccept.length} оплаченных заказов`}
            active
          >
            <DriverSettlementResidents orders={awaitingAccept} showAcceptActions />
          </DriverSettlementSection>
        ) : null}

        {showChecklist && workRoundId ? (
          <ProcurementChecklistCard roundId={workRoundId} />
        ) : null}

        {!hasAnyOrders ? (
          <EmptyState
            icon={Package}
            title="Заказов пока нет"
            description={
              hasOpenCollection
                ? "Жители оформляют заказы — они появятся здесь после оплаты"
                : "Откройте сбор в разделе «Сборы»"
            }
          />
        ) : settlementBlocks.length > 0 ? (
          <div className="flex flex-col gap-5">
            {settlementBlocks.map((block, index) => {
              const pendingAccept = block.orders.filter(isAwaitingTripAccept).length
              const isCurrent =
                currentStop?.pickupPointId === block.pickupPointId
              return (
                <DriverSettlementSection
                  key={block.pickupPointId}
                  index={index + 1}
                  label={block.label}
                  meta={`${block.orders.length} заказ(ов)${
                    pendingAccept > 0 ? ` · ${pendingAccept} к принятию` : ""
                  }`}
                  active={isCurrent}
                >
                  <DriverSettlementResidents
                    orders={block.orders}
                    showAcceptActions={pendingAccept > 0}
                    compact
                  />
                </DriverSettlementSection>
              )
            })}
          </div>
        ) : (
          <DriverSettlementResidents
            orders={orders}
            showAcceptActions={awaitingAccept.length > 0}
          />
        )}
      </div>
    </PageShell>
  )
}
