import { Link } from "react-router-dom"
import { CheckCircle2, Package, PackageCheck, Truck, WifiOff } from "lucide-react"

import { useEmployeeWorkspace } from "@/entities/employee/api/useEmployeeWorkspace"
import { routes } from "@/shared/config/routes"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const EmployeeDashboardPage = () => {
  const { data: workspace, isLoading } = useEmployeeWorkspace()

  const stats = workspace?.stats

  return (
    <PageShell>
      <PageHeader
        title="Сводка"
        subtitle={
          workspace
            ? `${workspace.pickupPoint.name}, ${workspace.pickupPoint.address}`
            : "Быстрые действия для ПВЗ"
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-blue-100 bg-blue-50/40">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Truck size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Ждут приёма</p>
                <p className="text-xl font-bold text-slate-900">
                  {stats?.awaitingDriver ?? 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Package size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Готовы к выдаче</p>
                <p className="text-xl font-bold text-slate-900">
                  {stats?.readyForHandout ?? 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Link to={routes.employee.intake}>
          <Card className="border-blue-200 transition-colors hover:border-blue-300">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <PackageCheck size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Приём от водителя</p>
                <p className="text-sm text-slate-600">
                  Отметьте заказы по сбору, когда водитель привёз товар
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to={routes.employee.handout}>
          <Card className="border-emerald-200 transition-colors hover:border-emerald-300">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Выдача жителям</p>
                <p className="text-sm text-slate-600">
                  Выдайте заказы, которые уже приняты на ПВЗ
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <Card className="border-amber-200 bg-amber-50/40">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <WifiOff size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Offline-режим</p>
            <p className="mt-1 text-sm text-slate-600">
              Приём и выдача сохраняются в очередь и синхронизируются при появлении сети.
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  )
}
