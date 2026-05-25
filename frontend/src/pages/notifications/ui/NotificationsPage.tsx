import { Bell } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/entities/notification/api/useNotifications"
import { formatShortDate } from "@/shared/lib/format"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { cn } from "@/shared/lib/cn"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"

export const NotificationsPage = () => {
  const profileRoutes = useProfileRoutes()
  const user = useAuthStore((s) => s.user)
  const { data: notifications, isLoading } = useNotifications(user?.id)
  const markRead = useMarkNotificationRead(user?.id ?? "")

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Уведомления" backTo={profileRoutes.profile} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id)
                }}
                className="w-full text-left"
              >
                <Card
                  className={cn(
                    "transition",
                    !n.read && "border-blue-200 bg-blue-50/40",
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatShortDate(n.createdAt)}
                  </p>
                </Card>
              </button>
            </li>
          ))}
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
