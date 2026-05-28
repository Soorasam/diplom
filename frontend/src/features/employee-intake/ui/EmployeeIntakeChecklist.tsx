import { useEffect, useMemo, useState } from "react"
import {
  Check,
  CheckCircle2,
  Clock,
  PackageCheck,
  Phone,
  Truck,
  User,
  X,
} from "lucide-react"

import type {
  EmployeeIntakeGroup,
  EmployeeWorkspace,
  EmployeeWorkspaceOrder,
} from "@/entities/employee/api/employeeApi"
import { formatPrice } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { cn } from "@/shared/lib/cn"

type ReceiveResult = { stopCompleted?: boolean }

type Props = {
  workspace: EmployeeWorkspace
  onReceive: (orderId: string, roundId: string) => Promise<ReceiveResult | void>
  receivePending: boolean
}

const isWaitingDriver = (status: string) =>
  status === "confirmed" || status === "submitted" || status === "pending"

const orderStatusUi: Record<
  string,
  {
    label: string
    hint: string
    variant: "info" | "default" | "success"
    canAct: boolean
  }
> = {
  in_transit: {
    label: "Водитель привёз",
    hint: "Проверьте товар и отметьте приём",
    variant: "info",
    canAct: true,
  },
  confirmed: {
    label: "Ещё в пути",
    hint: "Водитель завершает закупку или едет к вам",
    variant: "default",
    canAct: false,
  },
  submitted: {
    label: "Оформлен",
    hint: "Появится после отправки рейса",
    variant: "default",
    canAct: false,
  },
  pending: {
    label: "Оформлен",
    hint: "Появится после отправки рейса",
    variant: "default",
    canAct: false,
  },
  at_pickup: {
    label: "Принят",
    hint: "Передайте жителю во вкладке «Выдача»",
    variant: "success",
    canAct: false,
  },
}

function orderLabel(o: EmployeeWorkspaceOrder) {
  return o.publicNumber ?? `№ ${o.id.slice(0, 8)}`
}

function IntakeOrderRow({
  order,
  roundId,
  roundDone,
  onReceive,
  receivePending,
  justReceived,
}: {
  order: EmployeeWorkspaceOrder
  roundId: string
  roundDone: boolean
  onReceive: (orderId: string, roundId: string) => Promise<void>
  receivePending: boolean
  justReceived: boolean
}) {
  const ui = orderStatusUi[order.status] ?? orderStatusUi.confirmed
  const canReceive = (order.canReceive ?? order.status === "in_transit") && ui.canAct
  const received = order.status === "at_pickup" || justReceived
  const [arrivedMap, setArrivedMap] = useState<Record<string, boolean>>({})
  const [confirmAll, setConfirmAll] = useState(false)
  const [confirmMissingOpen, setConfirmMissingOpen] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!confirmMissingOpen || countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [confirmMissingOpen, countdown])

  const keyFor = (itemName: string, idx: number) => `${itemName}-${idx}`
  const arrivedCount = order.items.filter((item, idx) => arrivedMap[keyFor(item.name, idx)]).length
  const missingItems = order.items
    .filter((item, idx) => !arrivedMap[keyFor(item.name, idx)])
    .map((i) => i.name)

  const handleConfirmReceive = async () => {
    await onReceive(order.id, roundId)
    setConfirmAll(false)
    setConfirmMissingOpen(false)
    setCountdown(10)
  }

  const onPrimaryClick = async () => {
    if (!canReceive || receivePending || roundDone) return
    if (missingItems.length === 0) {
      if (!confirmAll) {
        setConfirmAll(true)
        return
      }
      await handleConfirmReceive()
      return
    }
    setConfirmMissingOpen(true)
    setCountdown(10)
  }

  return (
    <li
      className={cn(
        "rounded-2xl border bg-white p-4 transition-colors",
        received ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-slate-900">{orderLabel(order)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <User size={14} className="shrink-0 text-slate-400" />
              {order.driverName ?? "Водитель"}
            </span>
            {order.driverPhone ? (
              <a
                href={`tel:${order.driverPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1 font-medium text-sky-700"
              >
                <Phone size={14} />
                {order.driverPhone}
              </a>
            ) : null}
          </div>
        </div>
        <Badge variant={received ? "success" : ui.variant}>
          {received ? "Принят" : ui.label}
        </Badge>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Состав заказа
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {order.items.map((item, idx) => {
            const key = keyFor(item.name, idx)
            const isArrived = received || Boolean(arrivedMap[key])
            return (
              <li key={key} className="flex items-start gap-2 text-sm">
                <button
                  type="button"
                  disabled={received || !canReceive || receivePending || roundDone}
                  onClick={() =>
                    setArrivedMap((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-colors",
                    isArrived
                      ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                      : "border-red-300 bg-red-50 text-red-500",
                    received || !canReceive || receivePending || roundDone
                      ? "cursor-default"
                      : "cursor-pointer",
                  )}
                >
                  {isArrived ? <Check size={12} strokeWidth={3} /> : idx + 1}
                </button>
                <span className="text-slate-800">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-slate-500">
                    {" "}
                    — {item.quantity} {item.unit}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
        {!received && canReceive ? (
          <p className="mt-2 text-xs text-slate-500">
            Отметьте прибывшие товары: {arrivedCount}/{order.items.length}
          </p>
        ) : null}
        <p className="mt-2 text-right text-sm font-semibold text-slate-900">
          {formatPrice(order.totalAmount)}
        </p>
      </div>

      {received ? (
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />
          Принят на ПВЗ — можно выдавать жителю
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs text-slate-500">{ui.hint}</p>
          <Button
            type="button"
            className="mt-3 w-full"
            size="lg"
            leftIcon={<PackageCheck size={20} />}
            disabled={receivePending || roundDone || !canReceive}
            onClick={() => void onPrimaryClick()}
          >
            {!canReceive
              ? "Жду водителя"
              : confirmAll
                ? "Вы уверены?"
                : "Подтвердить приём"}
          </Button>
          {confirmMissingOpen ? (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-amber-900">
                  Вы уверены, что следующие товары не прибыли?
                </p>
                <button
                  type="button"
                  className="text-amber-700"
                  onClick={() => {
                    setConfirmMissingOpen(false)
                    setCountdown(10)
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <ul className="mt-2 list-disc pl-5 text-xs text-amber-900">
                {missingItems.map((name, idx) => (
                  <li key={`${name}-${idx}`}>{name}</li>
                ))}
              </ul>
              <Button
                type="button"
                className="mt-3 w-full"
                size="sm"
                disabled={countdown > 0 || receivePending}
                onClick={() => void handleConfirmReceive()}
              >
                {countdown > 0 ? `Подтвердить (${countdown})` : "Подтвердить приём"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </li>
  )
}

function IntakeRoundBlock({
  group,
  onReceive,
  receivePending,
  receivedFlash,
}: {
  group: EmployeeIntakeGroup
  onReceive: (orderId: string, roundId: string) => Promise<void>
  receivePending: boolean
  receivedFlash: Set<string>
}) {
  const done = group.stopStatus === "completed"
  const pendingCount = group.progress.pending
  const readyCount = group.orders.filter((o) => o.status === "in_transit").length

  const sorted = [...group.orders].sort((a, b) => {
    const score = (o: EmployeeWorkspaceOrder) =>
      o.status === "in_transit" ? 0 : o.status === "confirmed" ? 1 : 2
    return score(a) - score(b)
  })

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Рейс</p>
          <h2 className="text-base font-semibold text-slate-900">{group.roundTitle}</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {readyCount > 0
              ? `${readyCount} к приёму`
              : pendingCount > 0
                ? `${pendingCount} ожидают водителя`
                : "Все заказы приняты"}
            {group.progress.total > 0
              ? ` · ${group.progress.received} из ${group.progress.total} готово`
              : null}
          </p>
        </div>
        {done ? (
          <Badge variant="success">Рейс закрыт</Badge>
        ) : readyCount > 0 ? (
          <Badge variant="info">Приём</Badge>
        ) : (
          <Badge variant="default">Ожидание</Badge>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {sorted.map((order) => (
          <IntakeOrderRow
            key={order.id}
            order={order}
            roundId={group.roundId}
            roundDone={done}
            onReceive={onReceive}
            receivePending={receivePending}
            justReceived={receivedFlash.has(order.id)}
          />
        ))}
      </ul>
    </section>
  )
}

export const EmployeeIntakeChecklist = ({
  workspace,
  onReceive,
  receivePending,
}: Props) => {
  const [receivedFlash, setReceivedFlash] = useState<Set<string>>(new Set())
  const [completedRoundFlash, setCompletedRoundFlash] = useState<string | null>(null)

  const totals = useMemo(() => {
    const all = workspace.intakeGroups.flatMap((g) => g.orders)
    return {
      toReceive: all.filter((o) => o.status === "in_transit").length,
      waiting: all.filter((o) => isWaitingDriver(o.status)).length,
      rounds: workspace.intakeGroups.length,
    }
  }, [workspace.intakeGroups])

  const handleReceive = async (orderId: string, roundId: string) => {
    const result = await onReceive(orderId, roundId)
    if (result?.stopCompleted) {
      setCompletedRoundFlash(roundId)
      setTimeout(() => setCompletedRoundFlash(null), 5000)
    }
    setReceivedFlash((prev) => new Set(prev).add(orderId))
    setTimeout(() => {
      setReceivedFlash((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }, 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="ui-panel-gradient">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-sky-700 shadow-sm">
            <Truck size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium ui-text-accent">Чек-лист приёма</p>
            <p className="font-semibold text-slate-900">{workspace.pickupPoint.name}</p>
            {workspace.pickupPoint.address ? (
              <p className="text-xs text-slate-600">{workspace.pickupPoint.address}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {totals.toReceive > 0 ? (
                <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                  {totals.toReceive} принять сейчас
                </span>
              ) : null}
              {totals.waiting > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  <Clock size={12} />
                  {totals.waiting} ждут водителя
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Сверьте товары с заказом и нажмите «Принял от водителя». Когда все заказы на вашем ПВЗ
          приняты — водитель сможет завершить точку маршрута.
        </p>
      </Card>

      {completedRoundFlash ? (
        <Card className="border-emerald-200 bg-emerald-50/80">
          <p className="text-sm font-semibold text-emerald-800">
            Все заказы этого рейса приняты — водитель может ехать дальше
          </p>
        </Card>
      ) : null}

      {workspace.intakeGroups.map((group) => (
        <IntakeRoundBlock
          key={group.roundId}
          group={group}
          onReceive={handleReceive}
          receivePending={receivePending}
          receivedFlash={receivedFlash}
        />
      ))}
    </div>
  )
}
