import { useState } from "react"
import { Link } from "react-router-dom"
import { Check, Copy, Phone, Truck } from "lucide-react"

import { useConfirmAllReceipts } from "@/entities/order/api/useOrders"
import type { Order, Procurement } from "@/shared/api/api-types"
import { routes } from "@/shared/config/routes"
import { copyTextToClipboard } from "@/shared/lib/copy-text"
import { formatPrice } from "@/shared/lib/format"
import { getResidentProcurementPhase } from "@/shared/lib/resident-procurement-phase"
import { resolveProcurementRouteTitle } from "@/shared/lib/procurement-route-title"
import { Button } from "@/shared/ui/button/Button"
import { cn } from "@/shared/lib/cn"

type Props = {
  procurement: Procurement
  orders?: Order[]
  settlementName?: string | null
  userPickupPointId?: string | null
}

export const ResidentProcurementHero = ({
  procurement,
  orders = [],
  settlementName,
  userPickupPointId,
}: Props) => {
  const phase = getResidentProcurementPhase({
    procurement,
    orders,
    settlementName,
    userPickupPointId,
    routeProgress: procurement.routeProgress,
  })
  const [copied, setCopied] = useState(false)
  const confirmAll = useConfirmAllReceipts()

  const activeOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  )
  const confirmable = orders.filter(
    (o) => o.status === "in_transit" || o.status === "at_pickup",
  )
  const unpaid = activeOrders.filter((o) => o.paymentStatus === "pending")

  const combinedTotal = activeOrders.reduce((sum, o) => sum + o.total, 0)
  const combinedItems = activeOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0,
  )

  const handleCopyPhone = async () => {
    if (!procurement.driverPhone) return
    const ok = await copyTextToClipboard(procurement.driverPhone)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirmAll = () => {
    if (confirmable.length === 0) return
    confirmAll.mutate(confirmable.map((o) => o.id))
  }

  const catalogCta =
    procurement.status === "open" || procurement.status === "closing"
      ? { label: "В каталог", to: routes.user.catalog }
      : null

  return (
    <div className="ui-phase-hero">
      <div className="p-5">
        <p className="ui-phase-hero-label">{procurement.title}</p>
        <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight">
          {phase.headline}
        </h2>
        {phase.subline ? (
          <p className="ui-phase-hero-subtitle mt-2 leading-relaxed">{phase.subline}</p>
        ) : null}
        {phase.currentLocationLabel ? (
          <p className="mt-2 text-xs font-medium text-sky-700 dark:text-sky-300">
            Сейчас: {phase.currentLocationLabel}
          </p>
        ) : null}

        <ol className="ui-phase-hero-divider mt-5 flex items-center justify-between gap-1 border-t pt-4">
          {phase.steps.map((step, index) => (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
                  step.status === "done" &&
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                  step.status === "active" &&
                    "bg-sky-600 text-white ring-2 ring-sky-200 dark:bg-sky-500 dark:ring-sky-400/40",
                  step.status === "pending" &&
                    "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500",
                )}
              >
                {step.status === "done" ? <Check size={14} /> : index + 1}
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-medium",
                  step.status === "active"
                    ? "text-sky-700 dark:text-sky-300"
                    : "text-slate-500",
                )}
              >
                {step.shortLabel}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="ui-phase-hero-footer space-y-3 px-5 py-4">
        <p className="ui-phase-hero-footer-hint">
          Маршрут: {resolveProcurementRouteTitle(procurement)}
        </p>

        {(procurement.driverName || procurement.driverPhone) && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <span className="ui-icon-soft h-10 w-10 shrink-0 rounded-xl">
                <Truck size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Водитель
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {procurement.driverName ?? "—"}
                </p>
              </div>
            </div>
            {procurement.driverPhone ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`tel:${procurement.driverPhone.replace(/\s/g, "")}`}
                  className="ui-cta-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  <Phone size={16} />
                  Позвонить
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                  onClick={() => void handleCopyPhone()}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Скопировано" : "Скопировать"}
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {activeOrders.length > 0 ? (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {activeOrders.length > 1
              ? `${activeOrders.length} заказа · ${combinedItems} поз. · ${formatPrice(combinedTotal)}`
              : `${combinedItems} поз. · ${formatPrice(combinedTotal)}`}
          </p>
        ) : null}

        {confirmable.length > 0 ? (
          <Button
            type="button"
            fullWidth
            size="lg"
            className="ui-cta-primary"
            loading={confirmAll.isPending}
            onClick={handleConfirmAll}
          >
            Подтвердить получение
            {confirmable.length > 1 ? ` (${confirmable.length})` : ""}
          </Button>
        ) : unpaid.length === 1 ? (
          <Link to={routes.user.order(unpaid[0].id)} className="block">
            <Button type="button" fullWidth size="lg" className="ui-cta-primary">
              Оплатить заказ
            </Button>
          </Link>
        ) : unpaid.length > 1 ? (
          <Link to={routes.user.orders} className="block">
            <Button type="button" fullWidth size="lg" className="ui-cta-primary">
              Оплатить заказы ({unpaid.length})
            </Button>
          </Link>
        ) : activeOrders.length === 1 ? (
          <Link to={routes.user.order(activeOrders[0].id)} className="block">
            <Button type="button" fullWidth size="lg" variant="outline">
              Мой заказ
            </Button>
          </Link>
        ) : catalogCta ? (
          <Link to={catalogCta.to} className="block">
            <Button type="button" fullWidth size="lg" className="ui-cta-primary">
              {catalogCta.label}
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
