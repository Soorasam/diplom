import { normalizeMediaUrl } from "@/shared/lib/normalize-media-url"

import type { TicketDetail } from "../model/types"

export function mapTicketDetail(ticket: TicketDetail): TicketDetail {
  return {
    ...ticket,
    messages: ticket.messages.map((m) => ({
      ...m,
      attachments: m.attachments.map((a) => ({
        ...a,
        url: normalizeMediaUrl(a.url),
      })),
    })),
  }
}
