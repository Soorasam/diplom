import { Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  ListOrdered,
  PackageSearch,
  QrCode,
  User,
} from "lucide-react"

import { routes } from "@/shared/config/routes"
import { MobilePageLayout } from "@/shared/ui/mobile-page-layout/MobilePageLayout"
import {
  MobileBottomNav,
  type MobileNavTab,
} from "@/widgets/mobile-bottom-nav/ui/MobileBottomNav"

const tabs: MobileNavTab[] = [
  {
    label: "Сводка",
    path: routes.employee.root,
    icon: LayoutDashboard,
    match: (p) => p === routes.employee.root,
  },
  {
    label: "Сборы",
    path: routes.employee.procurements,
    icon: PackageSearch,
    match: (p) => p.startsWith(routes.employee.procurements),
  },
  {
    label: "Заказы",
    path: routes.employee.orders,
    icon: ListOrdered,
    match: (p) => p.startsWith(routes.employee.orders),
  },
  {
    label: "Скан",
    path: routes.employee.scan,
    icon: QrCode,
    match: (p) => p.startsWith(routes.employee.scan),
  },
  {
    label: "Профиль",
    path: routes.employee.profile,
    icon: User,
    match: (p) => p.startsWith(routes.employee.profile),
  },
]

export const EmployeeLayout = () => (
  <MobilePageLayout>
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col safe-top">
      <Outlet />
    </main>
    <MobileBottomNav tabs={tabs} />
  </MobilePageLayout>
)
