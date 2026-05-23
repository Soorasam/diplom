import { Link, useNavigate } from "react-router-dom"
import { Package, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurements,
  useJoinProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useProcurementParticipation } from "@/features/procurement/hooks/useProcurementParticipation"
import { useCartStore } from "@/features/cart/model/cart-store"
import { routes } from "@/shared/config/routes"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { ActiveProcurementBanner } from "@/widgets/active-procurement-banner/ui/ActiveProcurementBanner"

export const CartProcurementBlock = () => {
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

  const { data: activeProcurements } = useActiveProcurements()
  const join = useJoinProcurement(user?.id)
  const { pushDraftItemsToServer } = useCartActions()

  const joinedOpen =
    activeProcurements?.filter(
      (p) => joinedRoundIds.includes(p.id) && p.status === "open",
    ) ?? []

  const handleJoinSelected = async () => {
    if (!procurementId || !isAuthenticated) return
    await join.mutateAsync(procurementId)
    await pushDraftItemsToServer(procurementId)
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
              Вступите в сбор, чтобы оформить заказ. Товары в корзине сохранятся.
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
              onClick={() => navigate(routes.activeProcurements)}
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
          onClick={() => navigate(routes.activeProcurements)}
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
          Вступите в сбор, чтобы перейти к оформлению заказа.
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
            onClick={() => navigate(routes.activeProcurements)}
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
      <ActiveProcurementBanner procurement={procurement} />
      {joinedOpen.length > 1 ? (
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          Другой ваш сбор
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
        </label>
      ) : null}
      <Link
        to={routes.activeProcurements}
        className="ui-link inline-block text-xs hover:underline"
      >
        Все сборы
      </Link>
    </div>
  )
}
