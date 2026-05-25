export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"

export type TicketAttachment = {
  id: string
  url: string
  fileName: string
  mimeType: string
  size: number
}

export type TicketMessage = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    name: string
    role: string
    isSelf: boolean
  }
  attachments: TicketAttachment[]
}

export type TicketSummary = {
  id: string
  subject: string
  status: TicketStatus
  orderId: string | null
  orderPublicNumber: string | null
  unread: boolean
  createdAt: string
  updatedAt: string
  lastMessagePreview: string | null
  messageCount: number
  user?: {
    id: string
    name: string
    email: string
    phone: string | null
  }
}

export type TicketDetail = TicketSummary & {
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
  }
  messages: TicketMessage[]
}

export const ticketStatusLabel: Record<TicketStatus, string> = {
  open: "Открыто",
  in_progress: "В работе",
  resolved: "Решено",
  closed: "Закрыто",
}
