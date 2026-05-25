import { Bell, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import type { Notification } from "@/shared/api/mock-db"
import { isTicketLinkedNotification } from "@/entities/notification/lib/ticket-notification"
import {
  useAutoMarkNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/entities/notification/api/useNotifications"
import { useMyTickets } from "@/entities/ticket/api/useTickets"
import { formatShortDate } from "@/shared/lib/format"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { cn } from "@/shared/lib/cn"

export const NotificationsPage = () => {
  const navigate = useNavigate()
  const profileRoutes = useProfileRoutes()
  const user = useAuthStore((s) => s.user)
  const { data: notifications, isLoading } = useNotifications(user?.id)
  const { data: tickets } = useMyTickets(Boolean(user?.id))
  const markRead = useMarkNotificationRead(user?.id ?? "")
  useAutoMarkNotificationsRead(user?.id, true)

  const resolveTicketId = (ticketId?: string | null) => {
    if (ticketId) return ticketId
    return tickets?.find((t) => t.unread)?.id
  }

  const handleOpen = async (n: Notification) => {
    if (!n.read) {
      try {
        await markRead.mutateAsync(n.id)
      } catch {
        return
      }
    }

    if (isTicketLinkedNotification(n)) {
      const targetId = resolveTicketId(n.ticketId)
      if (targetId) {
        navigate(profileRoutes.dispute(targetId))
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Уведомления" backTo={profileRoutes.profile} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => {
            const isTicket = isTicketLinkedNotification(n)
            const canOpenDispute = isTicket && Boolean(resolveTicketId(n.ticketId))

            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void handleOpen(n)}
                  disabled={isTicket && !canOpenDispute}
                  className={cn(
                    "w-full text-left",
                    isTicket && canOpenDispute && "cursor-pointer",
                  )}
                >
                  <Card
                    className={cn(
                      "transition",
                      !n.read && "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/30",
                      isTicket &&
                        canOpenDispute &&
                        "hover:border-blue-300 dark:hover:border-blue-700",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </p>
                      {isTicket && canOpenDispute ? (
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-blue-600 dark:text-blue-400"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
                    {isTicket && canOpenDispute ? (
                      <p className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-400">
                        Открыть переписку по спору
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-400">
                      {formatShortDate(n.createdAt)}
                    </p>
                  </Card>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Bell}
          title="Нет уведомлений"
          description="Здесь появятся сообщения о сборах и доставке"
        />
      )}
    </div>
  )
}
