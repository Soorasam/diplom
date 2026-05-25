import { useMemo } from "react"
import { MessageSquare } from "lucide-react"

import { useMyTickets } from "@/entities/ticket/api/useTickets"
import type { TicketSummary } from "@/entities/ticket/model/types"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { AdminTicketListSection } from "@/widgets/admin-ticket-list/ui/AdminTicketListSection"

const isActive = (t: TicketSummary) =>
  t.status === "open" || t.status === "in_progress"

const isClosed = (t: TicketSummary) =>
  t.status === "resolved" || t.status === "closed"

export const AdminTicketsPage = () => {
  const { data: tickets, isLoading } = useMyTickets()

  const { active, closed } = useMemo(() => {
    const list = tickets ?? []
    return {
      active: list.filter(isActive),
      closed: list.filter(isClosed),
    }
  }, [tickets])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Обращения"
        subtitle="Переписка с жителями по спорам и заказам"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : tickets && tickets.length > 0 ? (
        <>
          <AdminTicketListSection
            title="Новые и в работе"
            tickets={active}
            emptyText="Нет открытых обращений"
          />
          <AdminTicketListSection
            title="Закрытые и решённые"
            tickets={closed}
            emptyText="Нет завершённых обращений"
          />
        </>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="Обращений нет"
          description="Появятся, когда житель откроет спор по заказу"
        />
      )}
    </div>
  )
}
