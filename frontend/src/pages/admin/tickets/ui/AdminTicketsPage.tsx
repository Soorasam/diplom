import { MessageSquare } from "lucide-react"

import { useAdminTickets } from "@/entities/admin/api/useAdmin"
import { formatDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminTicketsPage = () => {
  const { data: tickets, isLoading } = useAdminTickets()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Обращения"
        subtitle="Уведомления пользователей из системы"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : tickets && tickets.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {tickets.map((t) => (
            <li key={t.id}>
              <Card className="border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.userName} · {t.userEmail} · {formatDate(t.createdAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{t.body}</p>
                  </div>
                  <Badge variant={t.read ? "default" : "warning"}>
                    {t.read ? "прочитано" : "новое"}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="Обращений нет"
          description="Появятся при создании уведомлений пользователям (например, по заявкам водителя)"
        />
      )}
    </div>
  )
}
