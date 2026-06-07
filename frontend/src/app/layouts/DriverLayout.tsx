import { Outlet } from "react-router-dom"
import { LayoutDashboard, Package, Route, ShoppingBasket, User } from "lucide-react"

import { routes } from "@/shared/config/routes"
import { MobilePageLayout } from "@/shared/ui/mobile-page-layout/MobilePageLayout"
import {
  MobileBottomNav,
  type MobileNavTab,
} from "@/widgets/mobile-bottom-nav/ui/MobileBottomNav"

const tabs: MobileNavTab[] = [
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
    label: "Маршрут",
    path: routes.driver.route,
    icon: Route,
    match: (p) => p.startsWith(routes.driver.route),
  },
  {
    label: "Выдача",
    path: routes.driver.handout,
    icon: Package,
    match: (p) => p.startsWith(routes.driver.handout),
  },
  {
    label: "Профиль",
    path: routes.driver.profile,
    icon: User,
    match: (p) => p.startsWith(routes.driver.profile),
  },
]

export const DriverLayout = () => (
  <MobilePageLayout>
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
      <Outlet />
    </main>
    <MobileBottomNav tabs={tabs} />
  </MobilePageLayout>
)
