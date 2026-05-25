import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import type { TicketStatus } from "../model/types"
import { ticketsApi } from "./ticketsApi"

export const useMyTickets = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.tickets.list,
    queryFn: () => ticketsApi.list(),
    enabled,
    refetchOnMount: "always",
  })

export const useTicketByOrder = (orderId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.tickets.byOrder(orderId ?? ""),
    queryFn: () => ticketsApi.getByOrder(orderId!),
    enabled: Boolean(orderId),
  })

const TICKET_POLL_MS = 4_000

export const useTicket = (id: string | undefined, options?: { poll?: boolean }) =>
  useQuery({
    queryKey: queryKeys.tickets.detail(id ?? ""),
    queryFn: () => ticketsApi.get(id!),
    enabled: Boolean(id),
    refetchInterval: options?.poll ? TICKET_POLL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })

export const useCreateTicket = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      orderId,
      body,
      files,
    }: {
      orderId: string
      body: string
      files?: File[]
    }) => ticketsApi.create(orderId, body, files ?? []),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tickets.list })
      if (data.orderId) {
        void qc.invalidateQueries({
          queryKey: queryKeys.tickets.byOrder(data.orderId),
        })
      }
    },
  })
}

export const useAddTicketMessage = (ticketId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      body,
      files,
    }: {
      body: string
      files?: File[]
    }) => ticketsApi.addMessage(ticketId, body, files ?? []),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.tickets.detail(ticketId), data)
      void qc.invalidateQueries({ queryKey: queryKeys.tickets.list })
      void qc.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
    },
  })
}

export const useUpdateTicketStatus = (ticketId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: TicketStatus) => ticketsApi.updateStatus(ticketId, status),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.tickets.detail(ticketId), data)
      void qc.invalidateQueries({ queryKey: queryKeys.tickets.list })
    },
  })
}

export const useUnreadDisputesCount = (enabled = true) => {
  const { data } = useMyTickets(enabled)
  return useMemo(() => data?.filter((t) => t.unread).length ?? 0, [data])
}
