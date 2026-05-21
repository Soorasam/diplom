import { Link } from "react-router-dom"
import { MessageSquare } from "lucide-react"

import { routes } from "@/shared/config/routes"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

export const MyDisputesPage = () => (
  <div className="flex flex-col gap-4 p-4 pb-8">
    <PageHeader title="Мои споры" backTo={routes.profile} />
    <EmptyState
      icon={MessageSquare}
      title="Споров пока нет"
      description="Откройте спор из карточки заказа, если возникла проблема с доставкой"
    />
    <Link
      to={routes.orders}
      className="text-center text-sm font-semibold text-blue-700"
    >
      Перейти к заказам
    </Link>
  </div>
)
