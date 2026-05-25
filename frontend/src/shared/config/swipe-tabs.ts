import { routes } from "@/shared/config/routes"


export const swipeTabRoutes = [
  routes.home,
  routes.activeProcurements,
  routes.catalog,
  routes.cart,
  routes.profile,
] as const

export type SwipeTabRoute = (typeof swipeTabRoutes)[number]


export function resolveSwipeTabIndex(pathname: string): number | null {
  if (pathname === routes.home) {
    return 0
  }

  if (
    pathname === routes.activeProcurements ||
    pathname.startsWith("/procurements/")
  ) {
    return 1
  }

  if (pathname === routes.catalog || pathname.startsWith("/product/")) {
    return 2
  }

  if (
    pathname === routes.cart ||
    pathname.startsWith(routes.checkout) ||
    pathname.startsWith(routes.payment)
  ) {
    return 3
  }

  if (
    pathname === routes.profile ||
    pathname.startsWith(routes.profileEdit) ||
    pathname.startsWith(routes.orders) ||
    pathname.startsWith(routes.notifications) ||
    pathname.startsWith(routes.disputes) ||
    pathname.startsWith(routes.support) ||
    pathname.startsWith(routes.addresses) ||
    pathname.startsWith(routes.pickupPoints)
  ) {
    return 4
  }

  return null
}
