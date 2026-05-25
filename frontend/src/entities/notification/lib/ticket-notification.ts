import type { Notification } from "@/shared/api/mock-db"

const TICKET_TITLES = new Set(["Ответ по обращению", "Обращение обновлено"])

export function isTicketLinkedNotification(n: Notification): boolean {
  return Boolean(n.ticketId) || TICKET_TITLES.has(n.title)
}
