import { routes } from "@/shared/config/routes"


export const swipeTabRoutes = [
  routes.user.root,
  routes.user.activeProcurements,
  routes.user.catalog,
  routes.user.cart,
  routes.user.profile,
] as const

export type SwipeTabRoute = (typeof swipeTabRoutes)[number]


export function resolveSwipeTabIndex(pathname: string): number | null {
  if (pathname === routes.user.root) {
    return 0
  }

  if (
    pathname === routes.user.activeProcurements ||
    pathname.startsWith("/user/procurements/")
  ) {
    return 1
  }

  if (pathname === routes.user.catalog || pathname.startsWith("/user/product/")) {
    return 2
  }

  if (
    pathname === routes.user.cart ||
    pathname.startsWith(routes.user.checkout) ||
    pathname.startsWith(routes.user.payment)
  ) {
    return 3
  }

  if (
    pathname === routes.user.profile ||
    pathname.startsWith(routes.user.profileEdit) ||
    pathname.startsWith(routes.user.orders) ||
    pathname.startsWith(routes.user.notifications) ||
    pathname.startsWith(routes.user.disputes) ||
    pathname.startsWith(routes.user.support) ||
    pathname.startsWith(routes.user.addresses) ||
    pathname.startsWith(routes.user.pickupPoints)
  ) {
    return 4
  }

  return null
}
