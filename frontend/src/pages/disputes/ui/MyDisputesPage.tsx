import { Link } from "react-router-dom"
import { MessageSquare } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useMyTickets } from "@/entities/ticket/api/useTickets"
import { TicketStatusBadge } from "@/features/tickets/ui/TicketThread"
import { routes } from "@/shared/config/routes"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const MyDisputesPage = () => {
  const profileRoutes = useProfileRoutes()
  const userId = useAuthStore((s) => s.user?.id)
  const { data, isLoading } = useMyTickets(Boolean(userId))
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Мои споры" backTo={profileRoutes.profile} />
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : data && data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {data.map((item) => (
            <li key={item.id}>
              <Link to={profileRoutes.dispute(item.id)}>
                <Card className="transition-colors hover:border-blue-300">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.subject}</p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <TicketStatusBadge status={item.status} />
                      {item.unread ? <Badge variant="info">ответ</Badge> : null}
                    </div>
                  </div>
                  {item.lastMessagePreview ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {item.lastMessagePreview}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-400">
                    {formatShortDate(item.updatedAt)}
                  </p>
                </Card>
              </Link>
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
      <Link to={routes.user.orders} className="text-center text-sm font-semibold text-blue-700">
        Перейти к заказам
      </Link>
    </div>
  )
}
