import { MessageSquare } from "lucide-react"

import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

export const AdminTicketsPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Споры"
        subtitle="Тикет-система: житель ↔ водитель ↔ админ"
      />

      <Card className="border-slate-200">
        <p className="text-sm font-semibold text-slate-900">MVP UX</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Список тикетов: статус, участники, last message, SLA</li>
          <li>Карточка тикета: чат, вложения, история статусов</li>
          <li>Статусы: open / in_progress / resolved / rejected</li>
        </ul>
      </Card>

      <EmptyState
        icon={MessageSquare}
        title="Тикетов нет"
        description="После интеграции появятся обращения пользователей"
      />
    </div>
  )
}

