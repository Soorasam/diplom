import { Link } from "react-router-dom"
import { ShoppingCart, Truck } from "lucide-react"

import type { Procurement } from "@/shared/api/mock-db"
import { routes } from "@/shared/config/routes"
import { formatShortDate, formatWeightKg } from "@/shared/lib/format"
import { Card } from "@/shared/ui/card/Card"
import { ProcurementProgress } from "@/widgets/procurement-progress/ui/ProcurementProgress"

interface ActiveProcurementBannerProps {
  procurement: Procurement
}

/** Компактная плашка — в одной колонке с каталогом, с боковыми отступами */
export const ActiveProcurementBanner = ({ procurement }: ActiveProcurementBannerProps) => {
  const leftKg = Math.max(procurement.targetWeightKg - procurement.currentWeightKg, 0)

  return (
    <Card
      className="border-blue-200/90 bg-gradient-to-br from-blue-50 to-white !p-3.5 shadow-sm"
      aria-label="Активный сбор"
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Truck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
            Ваш сбор
          </p>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {procurement.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            до {formatShortDate(procurement.closesAt)} · свободно {formatWeightKg(leftKg)}
          </p>
        </div>
        <Link
          to={routes.cart}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
          aria-label="Корзина"
        >
          <ShoppingCart size={18} />
        </Link>
      </div>

      <div className="mt-3">
        <ProcurementProgress procurement={procurement} size="sm" />
      </div>
    </Card>
  )
}
