import { routes } from "@/shared/config/routes"

/** Порядок вкладок нижнего навбара жителя (слева направо) */
export const swipeTabRoutes = [
  routes.activeProcurements,
  routes.catalog,
  routes.cart,
  routes.orders,
  routes.notifications,
  routes.profile,
] as const

export type SwipeTabRoute = (typeof swipeTabRoutes)[number]

/** Индекс вкладки для текущего пути; null — свайп отключён */
export function resolveSwipeTabIndex(pathname: string): number | null {
  if (
    pathname === routes.activeProcurements ||
    pathname.startsWith("/procurements/")
  ) {
    return 0
  }

  if (pathname === routes.catalog || pathname.startsWith("/product/")) {
    return 1
  }

  if (
    pathname === routes.cart ||
    pathname.startsWith(routes.checkout) ||
    pathname.startsWith(routes.payment)
  ) {
    return 2
  }

  if (pathname.startsWith(routes.orders)) return 3

  if (pathname.startsWith(routes.notifications)) return 4

  if (
    pathname === routes.profile ||
    pathname.startsWith(routes.profileEdit) ||
    pathname.startsWith(routes.disputes) ||
    pathname.startsWith(routes.support) ||
    pathname.startsWith(routes.addresses) ||
    pathname.startsWith(routes.pickupPoints)
  ) {
    return 5
  }

  return null
}
