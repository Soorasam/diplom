import { useEffect, useRef } from "react"

import type { TicketDetail } from "@/entities/ticket/model/types"
import { shouldShowMessageBody } from "@/features/tickets/lib/message-body"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"

import { TicketAttachmentView } from "./TicketAttachmentView"
import { TicketMessageForm } from "./TicketMessageForm"

type Props = {
  ticket: TicketDetail
  canReply: boolean
  onSend: (body: string, files: File[]) => Promise<void>
  sending?: boolean
}

export const TicketThread = ({ ticket, canReply, onSend, sending }: Props) => {
  const endRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(ticket.messages.length)

  useEffect(() => {
    const grew = ticket.messages.length > prevCountRef.current
    prevCountRef.current = ticket.messages.length
    endRef.current?.scrollIntoView({ behavior: grew ? "smooth" : "auto" })
  }, [ticket.messages.length, ticket.messages])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-3">
        {ticket.messages.map((msg) => {
          const isAdmin = msg.author.role === "admin"
          const alignRight = msg.author.isSelf
          const onDark = alignRight || isAdmin
          const showBody = shouldShowMessageBody(msg.body, msg.attachments.length)

          return (
            <div
              key={msg.id}
              className={`flex ${alignRight ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3 py-2 sm:max-w-[85%] ${
                  alignRight
                    ? "bg-blue-600 text-white"
                    : isAdmin
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                <p className="text-xs font-medium opacity-80">
                  {msg.author.name}
                  {isAdmin ? " · поддержка" : ""}
                </p>
                {msg.attachments.length > 0 ? (
                  <ul className={`flex flex-col gap-2 ${showBody ? "mt-2" : "mt-1"}`}>
                    {msg.attachments.map((a) => (
                      <li key={a.id}>
                        <TicketAttachmentView attachment={a} onDarkBubble={onDark} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {showBody ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm">{msg.body}</p>
                ) : null}
                <p className="mt-1 text-[10px] opacity-70">
                  {formatShortDate(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {canReply ? (
        <TicketMessageForm onSubmit={onSend} loading={sending} disabled={sending} />
      ) : (
        <p className="border-t border-slate-200 pt-3 text-center text-sm text-slate-500">
          Обращение закрыто — переписка недоступна
        </p>
      )}
    </div>
  )
}

export const TicketStatusBadge = ({ status }: { status: TicketDetail["status"] }) => {
  const variant =
    status === "open"
      ? "warning"
      : status === "in_progress"
        ? "info"
        : status === "resolved"
          ? "success"
          : "default"
  const labels = {
    open: "Открыто",
    in_progress: "В работе",
    resolved: "Решено",
    closed: "Закрыто",
  } as const
  return <Badge variant={variant}>{labels[status]}</Badge>
}
