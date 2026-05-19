import { BarChart3, Package, TrendingDown, TrendingUp, Users } from "lucide-react"

import { useAdminStats } from "@/entities/admin/api/useAdmin"
import { formatPrice } from "@/shared/lib/format"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminAnalyticsPage = () => {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!stats) return null

  const avgOrderValue = Math.round(stats.revenueMonth / Math.max(stats.ordersToday * 30, 1))
  const conversionRate = Math.round((stats.ordersToday / stats.participants) * 1000) / 10

  const blocks = [
    {
      title: "Выручка за месяц",
      value: formatPrice(stats.revenueMonth),
      change: "+12%",
      positive: true,
      icon: TrendingUp,
    },
    {
      title: "Заказов сегодня",
      value: String(stats.ordersToday),
      change: "+5%",
      positive: true,
      icon: Package,
    },
    {
      title: "Средний чек",
      value: formatPrice(avgOrderValue),
      change: "-2%",
      positive: false,
      icon: BarChart3,
    },
    {
      title: "Конверсия участников",
      value: `${conversionRate}%`,
      change: "+0.8%",
      positive: true,
      icon: Users,
    },
    {
      title: "Активные сборы",
      value: String(stats.activeProcurements),
      change: "стабильно",
      positive: true,
      icon: Package,
    },
    {
      title: "Водители в рейсе",
      value: String(stats.driversActive),
      change: "+1",
      positive: true,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Аналитика"
        subtitle="Ключевые показатели без графиков"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((block) => (
          <Card key={block.title} className="border-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">{block.title}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{block.value}</p>
                <p
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    block.positive ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {block.positive ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {block.change}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <block.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-blue-100 bg-blue-50/30">
        <p className="text-sm font-semibold text-slate-800">Сводка по сети</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Населённые пункты</p>
            <p className="text-lg font-bold text-slate-900">{stats.settlements}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Участники</p>
            <p className="text-lg font-bold text-slate-900">
              {stats.participants.toLocaleString("ru-RU")}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Активные сборы</p>
            <p className="text-lg font-bold text-slate-900">{stats.activeProcurements}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
