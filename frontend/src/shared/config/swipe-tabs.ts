import { routes } from "@/shared/config/routes"

/** Порядок вкладок нижнего навбара (слева направо) */
export const swipeTabRoutes = [
  routes.home,
  routes.catalog,
  routes.cart,
  routes.orders,
  routes.profile,
] as const

export type SwipeTabRoute = (typeof swipeTabRoutes)[number]

/** Индекс вкладки для текущего пути; null — свайп отключён */
export function resolveSwipeTabIndex(pathname: string): number | null {
  if (pathname === routes.home) return 0

  if (pathname === routes.catalog || pathname.startsWith("/product/")) return 1

  if (pathname === routes.cart || pathname.startsWith(routes.checkout)) return 2

  if (pathname.startsWith(routes.orders)) return 3

  if (
    pathname === routes.profile ||
    pathname.startsWith(routes.notifications) ||
    pathname.startsWith(routes.support) ||
    pathname.startsWith(routes.addresses) ||
    pathname.startsWith(routes.pickupPoints)
  ) {
    return 4
  }

  return null
}
