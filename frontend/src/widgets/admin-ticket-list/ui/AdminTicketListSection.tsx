import { Link } from "react-router-dom"

import type { TicketSummary } from "@/entities/ticket/model/types"
import { ticketStatusLabel } from "@/entities/ticket/model/types"
import { TicketStatusBadge } from "@/features/tickets/ui/TicketThread"
import { routes } from "@/shared/config/routes"
import { formatDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  title: string
  tickets: TicketSummary[]
  emptyText?: string
}

export const AdminTicketListSection = ({ title, tickets, emptyText }: Props) => (
  <section className="flex flex-col gap-3">
    <h2 className="ui-section-title text-base font-semibold text-slate-900 dark:text-slate-100">
      {title}
      <span className="ml-2 text-sm font-normal text-slate-500">({tickets.length})</span>
    </h2>
    {tickets.length === 0 ? (
      <p className="text-sm text-slate-500">{emptyText ?? "Нет обращений"}</p>
    ) : (
      <ul className="flex flex-col gap-3">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link to={routes.admin.ticket(t.id)}>
              <Card className="border-slate-200 transition-colors hover:border-blue-300">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {t.subject}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.user?.name ?? "Пользователь"} · {formatDate(t.updatedAt)}
                      {t.orderPublicNumber ? ` · ${t.orderPublicNumber}` : ""}
                    </p>
                    {t.lastMessagePreview ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {t.lastMessagePreview}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <TicketStatusBadge status={t.status} />
                    {t.unread ? <Badge variant="warning">новое</Badge> : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {ticketStatusLabel[t.status]} · {t.messageCount} сообщ.
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
)
