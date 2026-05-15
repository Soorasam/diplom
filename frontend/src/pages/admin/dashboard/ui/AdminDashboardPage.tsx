import {
  MapPin,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react"

import { useAdminStats } from "@/entities/admin/api/useAdmin"
import { formatPrice } from "@/shared/lib/format"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const statCards = [
  { key: "activeProcurements", label: "Активные сборы", icon: ShoppingCart, format: "number" },
  { key: "settlements", label: "Населённые пункты", icon: MapPin, format: "number" },
  { key: "participants", label: "Участники", icon: Users, format: "number" },
  { key: "ordersToday", label: "Заказов сегодня", icon: Package, format: "number" },
  { key: "revenueMonth", label: "Выручка за месяц", icon: TrendingUp, format: "price" },
  { key: "driversActive", label: "Водителей в рейсе", icon: Truck, format: "number" },
] as const

export const AdminDashboardPage = () => {
  const { data: stats, isLoading } = useAdminStats()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Дашборд"
        subtitle="Обзор кооперативных закупок Якутии"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map(({ key, label, icon: Icon, format }) => (
            <Card key={key} className="border-slate-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {format === "price"
                      ? formatPrice(stats[key])
                      : stats[key].toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
