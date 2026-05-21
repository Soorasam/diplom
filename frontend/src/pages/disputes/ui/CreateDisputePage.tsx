import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ImagePlus, MessageSquare } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useCreateDispute } from "@/entities/notification/api/useNotifications"
import { useOrder } from "@/entities/order/api/useOrders"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const CreateDisputePage = () => {
  const [params] = useSearchParams()
  const orderId = params.get("orderId") ?? ""
  const { data: order, isLoading } = useOrder(orderId)
  const userId = useAuthStore((s) => s.user?.id)
  const createDispute = useCreateDispute(userId)
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4">
        <PageHeader title="Спор" backTo={routes.orders} />
        <Card>
          <p className="text-sm text-slate-600">Заказ не найден</p>
          <Link to={routes.orders} className="mt-2 text-sm font-semibold text-blue-700">
            К заказам
          </Link>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <PageHeader title="Спор отправлен" backTo={routes.disputes} />
        <Card className="border-emerald-200 bg-emerald-50/50">
          <p className="text-sm font-semibold text-emerald-900">
            Обращение принято (статус open). Администратор рассмотрит его в ближайшее время.
          </p>
        </Card>
        <Link to={routes.disputes} className="text-center text-sm font-semibold text-blue-700">
          Мои споры
        </Link>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4 p-4 pb-8"
      onSubmit={async (e) => {
        e.preventDefault()
        if (description.trim().length < 10) return
        if (!orderId) return
        await createDispute.mutateAsync({ orderId, message: description.trim() })
        setSubmitted(true)
      }}
    >
      <PageHeader
        title="Открыть спор"
        backTo={routes.order(order.id)}
        subtitle={`Заказ № ${order.id.slice(0, 8)}`}
      />

      <Card>
        <label className="block text-sm font-semibold text-slate-900">
          Описание проблемы
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Опишите, что пошло не так…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
          />
        </label>
      </Card>

      <Card className="border-dashed border-slate-300">
        <div className="flex items-center gap-3 text-slate-600">
          <ImagePlus size={22} />
          <p className="text-sm">Фото можно будет прикрепить после подключения API споров</p>
        </div>
      </Card>

      <Button type="submit" fullWidth leftIcon={<MessageSquare size={18} />}>
        {createDispute.isPending ? "Отправка..." : "Отправить спор"}
      </Button>
    </form>
  )
}
