import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Package, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurementsEnriched,
  useJoinProcurement,
  useLeaveProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useProcurementParticipation } from "@/features/procurement/hooks/useProcurementParticipation"
import { LeaveProcurementPanel } from "@/features/procurement/ui/LeaveProcurementPanel"
import { useCartStore } from "@/features/cart/model/cart-store"
import { ApiError } from "@/shared/api/client"
import { routes } from "@/shared/config/routes"
import { useUserDeliverySettlement } from "@/shared/hooks/useUserDeliverySettlement"
import { isProcurementEligibleForUser } from "@/shared/lib/procurement-eligibility"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { ActiveProcurementBanner } from "@/widgets/active-procurement-banner/ui/ActiveProcurementBanner"

export const CartProcurementBlock = () => {
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setProcurement = useCartStore((s) => s.setProcurement)
  const {
    procurementId,
    procurement,
    joinedRoundIds,
    hasJoined,
    isRoundOpen,
    roundClosed,
    isAuthenticated,
  } = useProcurementParticipation()

  const { data: activeProcurements } = useActiveProcurementsEnriched()
  const { user: deliveryUser, settlementName } = useUserDeliverySettlement()
  const join = useJoinProcurement(user?.id)
  const leave = useLeaveProcurement(user?.id)
  const clearProcurement = useCartStore((s) => s.clearProcurement)
  const { pushDraftItemsToServer } = useCartActions()

  const joinedOpen =
    activeProcurements?.filter(
      (p) =>
        joinedRoundIds.includes(p.id) &&
        (p.status === "open" || p.status === "closing") &&
        isProcurementEligibleForUser(p, deliveryUser ?? user, settlementName),
    ) ?? []

  const handleJoinSelected = async () => {
    if (!procurementId || !isAuthenticated) return
    await join.mutateAsync(procurementId)
    await pushDraftItemsToServer(procurementId)
  }

  const handleLeaveSelected = async () => {
    if (!procurementId || !isAuthenticated) return
    try {
      await leave.mutateAsync(procurementId)
      clearProcurement()
      setLeaveError(null)
      setLeaveConfirmOpen(false)
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Не удалось выйти из сбора"
      setLeaveError(msg)
    }
  }

  const handleSelectRound = (id: string) => {
    setProcurement(id)
  }

  if (!isAuthenticated) {
    return (
      <AlertBanner variant="info" title="Войдите для оформления">
        <Link to={routes.auth} className="ui-link font-semibold underline">
          Авторизация
        </Link>{" "}
        нужна, чтобы вступить в сбор и оплатить заказ.
      </AlertBanner>
    )
  }

  if (!procurementId) {
    return (
      <Card className="w-full p-4">
        <div className="flex items-start gap-3">
          <span className="ui-icon-well flex h-10 w-10 shrink-0">
            <Truck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
              Сбор не выбран
            </p>
            <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
              Одна корзина на все сборы. Выберите сбор для оформления заказа — товары
              сохранятся.
            </p>
            {joinedOpen.length > 0 ? (
              <div className="mt-3">
                <label className="text-xs font-medium leading-normal text-slate-500 dark:text-slate-400">
                  Ваши сборы
                </label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleSelectRound(e.target.value)
                  }}
                >
                  <option value="">Выберите сбор</option>
                  {joinedOpen.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <Button
              type="button"
              fullWidth
              className="mt-3"
              onClick={() => navigate(routes.user.activeProcurements)}
            >
              Перейти к сборам
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (roundClosed) {
    return (
      <Card className="w-full p-4">
        <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
          Сбор закрыт
        </p>
        <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
          {procurement?.title ?? "Выбранный сбор"} больше не принимает заказы. Выберите другой
          открытый сбор.
        </p>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className="mt-3"
          onClick={() => navigate(routes.user.activeProcurements)}
        >
          Открытые сборы
        </Button>
      </Card>
    )
  }

  if (!hasJoined) {
    return (
      <Card className="w-full p-4">
        <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
          {procurement?.title ?? "Выбранный сбор"}
        </p>
        <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
          Вступите в этот сбор, чтобы оформить заказ. Товары в корзине общие для всех
          сборов.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            fullWidth
            loading={join.isPending}
            leftIcon={<Package size={18} />}
            onClick={() => void handleJoinSelected()}
          >
            Вступить в этот сбор
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => navigate(routes.user.activeProcurements)}
          >
            Другой сбор
          </Button>
        </div>
      </Card>
    )
  }

  if (!procurement || !isRoundOpen) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {leaveError ? (
        <AlertBanner variant="warning" title="Выйти нельзя">
          {leaveError}
        </AlertBanner>
      ) : null}
      <ActiveProcurementBanner procurement={procurement} />
      {leaveConfirmOpen ? (
        <LeaveProcurementPanel
          procurementTitle={procurement.title}
          loading={leave.isPending}
          onConfirm={() => void handleLeaveSelected()}
          onCancel={() => setLeaveConfirmOpen(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          fullWidth
          size="sm"
          onClick={() => setLeaveConfirmOpen(true)}
        >
          Выйти из сбора
        </Button>
      )}
      {joinedOpen.length > 0 ? (
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          Сбор для заказа
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={procurementId}
            onChange={(e) => handleSelectRound(e.target.value)}
          >
            {joinedOpen.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-400 dark:text-slate-500">
            Оформление пойдёт в выбранный сбор
          </span>
        </label>
      ) : null}
      <Link
        to={routes.user.activeProcurements}
        className="ui-link inline-block text-xs hover:underline"
      >
        Все сборы
      </Link>
    </div>
  )
}
