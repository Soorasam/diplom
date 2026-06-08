import { Link } from "react-router-dom"
import { Package, ShoppingBasket, Truck } from "lucide-react"

import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

type Props = {
  awaitingAcceptCount: number
  inTransitCount: number
  totalOrdersCount: number
  participantsCount?: number
}

export const DriverDashboardTiles = ({
  awaitingAcceptCount,
  inTransitCount,
  totalOrdersCount,
  participantsCount,
}: Props) => {
  type Tile = {
    key: string
    label: string
    value: number | undefined
    to: string
    icon: typeof Package
    highlight: boolean
    badge?: number
  }

  const tiles: Tile[] = [
    {
      key: "accept",
      label: "К принятию",
      value: awaitingAcceptCount,
      to: routes.driver.route,
      icon: Package,
      highlight: awaitingAcceptCount > 0,
    },
    {
      key: "orders",
      label: "Рейс",
      value: totalOrdersCount,
      to: routes.driver.route,
      icon: Package,
      highlight: false,
    },
    {
      key: "transit",
      label: "В доставке",
      value: inTransitCount,
      to: routes.driver.route,
      icon: Truck,
      highlight: false,
    },
    {
      key: "procurements",
      label: "Сборы",
      value: participantsCount,
      to: routes.driver.procurements,
      icon: ShoppingBasket,
      highlight: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <Link key={tile.key} to={tile.to} className="block min-h-[7.5rem]">
          <div
            className={cn(
              "relative flex h-full flex-col justify-between rounded-2xl border p-4 transition-colors",
              tile.highlight
                ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 ring-2 ring-emerald-400/60 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/30"
                : "border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-sky-50/50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600",
            )}
          >
            {tile.badge != null && tile.badge > 0 ? (
              <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {tile.badge > 9 ? "9+" : tile.badge}
              </span>
            ) : null}
            <tile.icon
              size={22}
              className={cn(
                tile.highlight
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-slate-500 dark:text-slate-400",
              )}
            />
            <div>
              <p
                className={cn(
                  "text-3xl font-bold tabular-nums leading-none",
                  tile.highlight ? "text-emerald-900 dark:text-emerald-100" : "text-slate-900 dark:text-slate-100",
                )}
              >
                {tile.value ?? "—"}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  tile.highlight
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {tile.label}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
