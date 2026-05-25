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
    path: routes.user.root,
    icon: Home,
    match: (p) => p === routes.user.root,
  },
  {
    label: "Сборы",
    path: routes.user.activeProcurements,
    icon: Truck,
    match: (p) => p === routes.user.activeProcurements || p.startsWith("/user/procurements/"),
  },
  {
    label: "Каталог",
    path: routes.user.catalog,
    icon: LayoutGrid,
    match: (p) => p.startsWith(routes.user.catalog) || p.startsWith("/user/product/"),
  },
  {
    label: "Корзина",
    path: routes.user.cart,
    icon: ShoppingCart,
    badge: cartBadge,
    match: (p) =>
      p.startsWith(routes.user.cart) ||
      p.startsWith(routes.user.checkout) ||
      p.startsWith(routes.user.payment),
  },
  {
    label: "Профиль",
    path: routes.user.profile,
    icon: User,
    badge: notifyBadge,
    match: (p) =>
      p === routes.user.profile ||
      p.startsWith(routes.user.profileEdit) ||
      p.startsWith(routes.user.orders) ||
      p.startsWith(routes.user.notifications) ||
      p.startsWith(routes.user.disputes) ||
      p.startsWith(routes.user.support) ||
      p.startsWith(routes.user.addresses) ||
      p.startsWith(routes.user.pickupPoints),
  },
]

export const BottomNav = () => {
  const itemCount = useValidCartItemCount()
  const unreadCount = useUnreadNotificationsCount()

  return <MobileBottomNav tabs={buildTabs(itemCount, unreadCount)} />
}
