import { BarChart3, Package, TrendingDown, TrendingUp, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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

  const ordersSeries = [
    { name: "Пн", orders: Math.max(1, Math.round(stats.ordersToday * 0.6)) },
    { name: "Вт", orders: Math.max(1, Math.round(stats.ordersToday * 0.75)) },
    { name: "Ср", orders: Math.max(1, Math.round(stats.ordersToday * 0.9)) },
    { name: "Чт", orders: Math.max(1, Math.round(stats.ordersToday * 1.1)) },
    { name: "Пт", orders: Math.max(1, Math.round(stats.ordersToday * 1.25)) },
    { name: "Сб", orders: Math.max(1, Math.round(stats.ordersToday * 1.15)) },
    { name: "Вс", orders: Math.max(1, stats.ordersToday) },
  ]

  const revenueSeries = ordersSeries.map((x, idx) => ({
    name: x.name,
    revenue: Math.round((stats.revenueMonth / 30) * (0.8 + idx * 0.05)),
  }))

  const ulusSeries = [
    { name: "Томпонский", orders: 120 },
    { name: "Верхневилюйский", orders: 180 },
    { name: "Нерюнгринский", orders: 90 },
    { name: "Хангаласский", orders: 160 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Аналитика"
        subtitle="Ключевые показатели и графики"
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200">
          <p className="text-sm font-semibold text-slate-900">Заказы за неделю</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersSeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-slate-200">
          <p className="text-sm font-semibold text-slate-900">Выручка (оценка)</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200">
        <p className="text-sm font-semibold text-slate-900">Активность улусов</p>
        <p className="mt-1 text-sm text-slate-600">
          В production: фильтры по периоду/сегменту, drill-down до населённых пунктов.
        </p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ulusSeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
