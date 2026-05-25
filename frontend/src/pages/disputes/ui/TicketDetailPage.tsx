import { useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useAddTicketMessage,
  useTicket,
} from "@/entities/ticket/api/useTickets"
import { queryKeys } from "@/shared/config/query-keys"
import { TicketStatusBadge, TicketThread } from "@/features/tickets/ui/TicketThread"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { routes } from "@/shared/config/routes"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const profileRoutes = useProfileRoutes()
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()
  const { data: ticket, isLoading, isError } = useTicket(id, { poll: true })
  const addMessage = useAddTicketMessage(id ?? "")

  useEffect(() => {
    if (!ticket?.id || !userId) return
    void qc.invalidateQueries({ queryKey: queryKeys.notifications(userId) })
  }, [ticket?.id, userId, qc])

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div className="p-4">
        <PageHeader title="Обращение" backTo={profileRoutes.disputes} />
        <Card>
          <p className="text-sm text-slate-600">Обращение не найдено</p>
        </Card>
      </div>
    )
  }

  const canReply =
    ticket.status === "open" || ticket.status === "in_progress"

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col gap-3 p-4 pb-6">
      <PageHeader
        title={ticket.subject}
        backTo={profileRoutes.disputes}
        subtitle={
          ticket.orderPublicNumber
            ? `Заказ ${ticket.orderPublicNumber}`
            : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <TicketStatusBadge status={ticket.status} />
        {ticket.unread ? (
          <span className="text-xs font-medium text-blue-700">Новый ответ</span>
        ) : null}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TicketThread
          ticket={ticket}
          canReply={canReply}
          sending={addMessage.isPending}
          onSend={async (body, files) => {
            await addMessage.mutateAsync({ body, files })
          }}
        />
      </Card>

      {ticket.orderId ? (
        <Link
          to={routes.user.order(ticket.orderId)}
          className="text-center text-sm font-semibold text-blue-700"
        >
          Перейти к заказу
        </Link>
      ) : null}
    </div>
  )
}
