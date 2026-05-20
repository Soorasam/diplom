import { Link, useLocation } from "react-router-dom"
import { Home, LayoutGrid, Package, ShoppingCart, User } from "lucide-react"

import { useCartStore } from "@/features/cart/model/cart-store"
import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

export const BottomNav = () => {
  const location = useLocation()
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  )

  const tabs = [
    {
      label: "Главная",
      path: routes.home,
      icon: Home,
      match: (p: string) => p === routes.home || p.startsWith(routes.activeProcurements),
    },
    {
      label: "Каталог",
      path: routes.catalog,
      icon: LayoutGrid,
      match: (p: string) =>
        p.startsWith(routes.catalog) || p.startsWith("/product"),
    },
    {
      label: "Корзина",
      path: routes.cart,
      icon: ShoppingCart,
      match: (p: string) =>
        p.startsWith(routes.cart) || p.startsWith(routes.checkout),
    },
    {
      label: "Заказы",
      path: routes.orders,
      icon: Package,
      match: (p: string) => p.startsWith(routes.orders),
    },
    {
      label: "Профиль",
      path: routes.profile,
      icon: User,
      match: (p: string) =>
        p.startsWith(routes.profile) ||
        p.startsWith(routes.notifications) ||
        p.startsWith(routes.support) ||
        p.startsWith(routes.addresses) ||
        p.startsWith(routes.pickupPoints),
    },
  ]

  return (
    <nav
      data-bottom-nav
      className="fixed bottom-0 left-[50vw] z-50 w-screen -translate-x-1/2 border-t border-slate-200 bg-white/95 shadow-[0_-4px_24px_-8px_rgba(37,99,235,0.12)] backdrop-blur-sm"
    >
      <div className="mx-auto flex h-16 w-full max-w-[480px] items-center justify-around px-1">
        {tabs.map((tab) => {
          const active = tab.match(location.pathname)
          const showBadge = tab.path === routes.cart && itemCount > 0

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "relative flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-colors",
                active ? "text-blue-700" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <tab.icon size={22} strokeWidth={active ? 2.25 : 2} />
              {showBadge ? (
                <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              ) : null}
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
