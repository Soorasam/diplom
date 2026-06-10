import { useMemo } from "react"
import { Outlet } from "react-router-dom"
import { LayoutDashboard, Route, ShoppingBasket, User } from "lucide-react"

import { routes } from "@/shared/config/routes"
import { useDriverWorkbench } from "@/shared/hooks/useDriverWorkbench"
import { MobilePageLayout } from "@/shared/ui/mobile-page-layout/MobilePageLayout"
import {
  MobileBottomNav,
  type MobileNavTab,
} from "@/widgets/mobile-bottom-nav/ui/MobileBottomNav"
import { ProcurementLiveSync } from "@/widgets/procurement-live-sync/ui/ProcurementLiveSync"

export const DriverLayout = () => {
  const { ordersBadgeCount } = useDriverWorkbench()

  const tabs: MobileNavTab[] = useMemo(
    () => [
      {
        label: "Сводка",
        path: routes.driver.root,
        icon: LayoutDashboard,
        match: (p) => p === routes.driver.root,
      },
      {
        label: "Сборы",
        path: routes.driver.procurements,
        icon: ShoppingBasket,
        match: (p) => p.startsWith(routes.driver.procurements),
      },
      {
        label: "Рейс",
        path: routes.driver.route,
        icon: Route,
        badge: ordersBadgeCount,
        match: (p) =>
          p.startsWith(routes.driver.route) || p.startsWith(routes.driver.orders),
      },
      {
        label: "Профиль",
        path: routes.driver.profile,
        icon: User,
        match: (p) => p.startsWith(routes.driver.profile),
      },
    ],
    [ordersBadgeCount],
  )

  return (
    <MobilePageLayout>
      <ProcurementLiveSync />
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <Outlet />
      </main>
      <MobileBottomNav tabs={tabs} />
    </MobilePageLayout>
  )
}
