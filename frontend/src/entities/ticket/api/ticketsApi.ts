import { http } from "@/shared/api/client"

import { mapTicketDetail } from "../lib/map-ticket"
import type { TicketDetail, TicketStatus, TicketSummary } from "../model/types"

export const ticketsApi = {
  list: () => http.get<TicketSummary[]>("/tickets", true),

  get: (id: string) =>
    http.get<TicketDetail>(`/tickets/${id}`, true).then(mapTicketDetail),

  getByOrder: (orderId: string) =>
    http.get<TicketSummary | null>(`/tickets/by-order/${orderId}`, true),

  create: (orderId: string, body: string, files: File[] = []) => {
    if (files.length === 0) {
      return http.post<TicketDetail>("/tickets", { orderId, body }, true).then(mapTicketDetail)
    }
    const form = new FormData()
    form.append("orderId", orderId)
    form.append("body", body)
    for (const file of files) {
      form.append("files", file)
    }
    return http.postForm<TicketDetail>("/tickets", form, true).then(mapTicketDetail)
  },

  addMessage: (ticketId: string, body: string, files: File[] = []) => {
    if (files.length === 0) {
      return http
        .post<TicketDetail>(`/tickets/${ticketId}/messages`, { body }, true)
        .then(mapTicketDetail)
    }
    const form = new FormData()
    form.append("body", body.trim())
    for (const file of files) {
      form.append("files", file)
    }
    return http
      .postForm<TicketDetail>(`/tickets/${ticketId}/messages`, form, true)
      .then(mapTicketDetail)
  },

  updateStatus: (ticketId: string, status: TicketStatus) =>
    http
      .patch<TicketDetail>(`/tickets/${ticketId}/status`, { status }, true)
      .then(mapTicketDetail),
}
