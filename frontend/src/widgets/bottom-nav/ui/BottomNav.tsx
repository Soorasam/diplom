import { Home, LayoutGrid, ShoppingCart, Truck, User } from "lucide-react"

import { useValidCartItemCount } from "@/features/cart/hooks/useCartSync"
import { useUnreadNotificationsCount } from "@/entities/notification/api/useNotifications"
import { routes } from "@/shared/config/routes"
import {
  MobileBottomNav,
  type MobileNavTab,
} from "@/widgets/mobile-bottom-nav/ui/MobileBottomNav"

const buildTabs = (cartBadge: number, notifyBadge: number): MobileNavTab[] => [
  {
    label: "Главная",
    path: routes.home,
    icon: Home,
    match: (p) => p === routes.home,
  },
  {
    label: "Сборы",
    path: routes.activeProcurements,
    icon: Truck,
    match: (p) => p === routes.activeProcurements || p.startsWith("/procurements/"),
  },
  {
    label: "Каталог",
    path: routes.catalog,
    icon: LayoutGrid,
    match: (p) => p.startsWith(routes.catalog) || p.startsWith("/product/"),
  },
  {
    label: "Корзина",
    path: routes.cart,
    icon: ShoppingCart,
    badge: cartBadge,
    match: (p) =>
      p.startsWith(routes.cart) ||
      p.startsWith(routes.checkout) ||
      p.startsWith(routes.payment),
  },
  {
    label: "Профиль",
    path: routes.profile,
    icon: User,
    badge: notifyBadge,
    match: (p) =>
      p === routes.profile ||
      p.startsWith(routes.profileEdit) ||
      p.startsWith(routes.orders) ||
      p.startsWith(routes.notifications) ||
      p.startsWith(routes.disputes) ||
      p.startsWith(routes.support) ||
      p.startsWith(routes.addresses) ||
      p.startsWith(routes.pickupPoints),
  },
]

export const BottomNav = () => {
  const itemCount = useValidCartItemCount()
  const unreadCount = useUnreadNotificationsCount()

  return <MobileBottomNav tabs={buildTabs(itemCount, unreadCount)} />
}
