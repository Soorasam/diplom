import { MapPin } from "lucide-react"

import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

export const AdminPvzPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="ПВЗ"
        subtitle="Управление пунктами выдачи и сотрудниками"
      />

      <Card className="border-slate-200">
        <p className="text-sm font-semibold text-slate-900">Что будет здесь</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>CRUD ПВЗ (адрес, координаты, часы работы)</li>
          <li>Сотрудники ПВЗ и привязка к конкретному ПВЗ</li>
          <li>Мониторинг активных выдач, статусы «готово/выдано»</li>
        </ul>
      </Card>

      <EmptyState
        icon={MapPin}
        title="ПВЗ не загружены"
        description="Подключим данные из backend и добавим таблицы/фильтры"
      />
    </div>
  )
}

