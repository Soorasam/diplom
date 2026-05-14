import { Link, useLocation } from "react-router-dom"

import {
  House,
  Package,
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
    },
    {
      label: "Каталог",
      path: "/catalog",
      icon: Package,
    },
    {
      label: "Корзина",
      path: "/cart",
      icon: ShoppingCart,
    },
    {
      label: "Профиль",
      path: "/profile",
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center ${
                active
                  ? "text-blue-600"
                  : "text-slate-400"
              }`}
            >
              <tab.icon size={22} />

              <span className="text-xs">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}