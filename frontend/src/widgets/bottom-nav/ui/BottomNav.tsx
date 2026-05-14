import { Link, useLocation } from "react-router-dom"

import {
  House,
  LayoutGrid,
  ShoppingCart,
  User,
} from "lucide-react"

export const BottomNav = () => {
  const location = useLocation()

  const tabs = [
    {
      label: "Главная",
      path: "/",
      icon: House,
      match: (p: string) => p === "/",
    },
    {
      label: "Каталог",
      path: "/catalog",
      icon: LayoutGrid,
      match: (p: string) => p.startsWith("/catalog") || p.startsWith("/product"),
    },
    {
      label: "Корзина",
      path: "/cart",
      icon: ShoppingCart,
      match: (p: string) => p.startsWith("/cart"),
    },
    {
      label: "Профиль",
      path: "/profile",
      icon: User,
      match: (p: string) => p.startsWith("/profile") || p.startsWith("/orders"),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-teal-200/60 bg-white/95 shadow-[0_-4px_24px_-8px_rgba(13,148,136,0.15)] backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around px-1">
        {tabs.map((tab) => {
          const active = tab.match(location.pathname)

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-colors ${
                active
                  ? "text-teal-700"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon
                size={22}
                strokeWidth={active ? 2.25 : 2}
                className={active ? "drop-shadow-sm" : undefined}
              />

              <span className="text-[11px] font-medium leading-tight">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
