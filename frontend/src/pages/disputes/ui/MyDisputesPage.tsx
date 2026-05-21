import { Link } from "react-router-dom"
import { MessageSquare } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useMyDisputes } from "@/entities/notification/api/useNotifications"
import { routes } from "@/shared/config/routes"
import { formatShortDate } from "@/shared/lib/format"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const MyDisputesPage = () => {
  const userId = useAuthStore((s) => s.user?.id)
  const { data, isLoading } = useMyDisputes(userId)

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Мои споры" backTo={routes.profile} />
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : data && data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {data.map((item) => (
            <li key={item.id}>
              <Card>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                <p className="mt-2 text-xs text-slate-400">{formatShortDate(item.createdAt)}</p>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="Споров пока нет"
          description="Откройте спор из карточки заказа, если возникла проблема с доставкой"
        />
      )}
      <Link to={routes.orders} className="text-center text-sm font-semibold text-blue-700">
        Перейти к заказам
      </Link>
    </div>
  )
}
