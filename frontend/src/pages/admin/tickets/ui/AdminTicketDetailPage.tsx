import { Link, useParams } from "react-router-dom"

import {
  useAddTicketMessage,
  useTicket,
  useUpdateTicketStatus,
} from "@/entities/ticket/api/useTickets"
import type { TicketStatus } from "@/entities/ticket/model/types"
import { TicketStatusBadge, TicketThread } from "@/features/tickets/ui/TicketThread"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const STATUS_ACTIONS: { status: TicketStatus; label: string }[] = [
  { status: "in_progress", label: "В работу" },
  { status: "resolved", label: "Решено" },
  { status: "closed", label: "Закрыть" },
]

export const AdminTicketDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: ticket, isLoading, isError } = useTicket(id, { poll: true })
  const addMessage = useAddTicketMessage(id ?? "")
  const updateStatus = useUpdateTicketStatus(id ?? "")

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div>
        <PageHeader title="Обращение" backTo={routes.admin.tickets} />
        <Card>
          <p className="text-sm text-slate-600">Обращение не найдено</p>
        </Card>
      </div>
    )
  }

  const canReply =
    ticket.status === "open" || ticket.status === "in_progress"

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-6rem)]">
      <PageHeader
        title={ticket.subject}
        backTo={routes.admin.tickets}
        subtitle={
          ticket.orderPublicNumber
            ? `Заказ ${ticket.orderPublicNumber} · ${ticket.user.name}`
            : ticket.user.name
        }
      />

      <Card className="flex flex-wrap items-center justify-between gap-3 border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <TicketStatusBadge status={ticket.status} />
          {ticket.unread ? (
            <span className="text-xs font-medium text-amber-700">Новое сообщение</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_ACTIONS.filter((a) => a.status !== ticket.status).map((a) => (
            <Button
              key={a.status}
              size="sm"
              variant="secondary"
              type="button"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate(a.status)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="min-h-[420px] flex-1 flex-col overflow-hidden lg:flex lg:min-h-0">
        <div className="mb-2 border-b border-slate-100 pb-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-800">{ticket.user.name}</span>
            {ticket.user.phone ? ` · ${ticket.user.phone}` : ""}
          </p>
          <p className="text-xs">{ticket.user.email}</p>
        </div>
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
          to={routes.admin.orders}
          className="text-sm font-semibold text-blue-700"
        >
          Все заказы в админке
        </Link>
      ) : null}
    </div>
  )
}
