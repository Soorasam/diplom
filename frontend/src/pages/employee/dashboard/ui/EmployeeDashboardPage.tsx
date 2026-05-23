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
          <Card className="ui-panel p-4">
            <div className="flex items-center gap-2">
              <div className="ui-icon-soft flex h-9 w-9 items-center justify-center rounded-lg">
                <Truck size={18} />
              </div>
              <div>
                <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                  Ждут приёма
                </p>
                <p className="text-xl font-bold leading-normal text-slate-900 dark:text-slate-100">
                  {stats?.awaitingDriver ?? 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="ui-panel p-4">
            <div className="flex items-center gap-2">
              <div className="ui-icon-soft flex h-9 w-9 items-center justify-center rounded-lg">
                <Package size={18} />
              </div>
              <div>
                <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                  Готовы к выдаче
                </p>
                <p className="text-xl font-bold leading-normal text-slate-900 dark:text-slate-100">
                  {stats?.readyForHandout ?? 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Link to={routes.employee.intake}>
          <Card className="ui-link-card p-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="ui-icon-solid flex h-11 w-11 items-center justify-center rounded-2xl">
                <PackageCheck size={22} />
              </div>
              <div>
                <p className="font-semibold leading-normal text-slate-900 dark:text-slate-100">
                  Приём от водителя
                </p>
                <p className="text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                  Отметьте заказы по сбору, когда водитель привёз товар
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to={routes.employee.handout}>
          <Card className="ui-link-card p-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="ui-icon-solid flex h-11 w-11 items-center justify-center rounded-2xl">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="font-semibold leading-normal text-slate-900 dark:text-slate-100">
                  Выдача жителям
                </p>
                <p className="text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                  Выдайте заказы, которые уже приняты на ПВЗ
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
            <WifiOff size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
              Offline-режим
            </p>
            <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
              Приём и выдача сохраняются в очередь и синхронизируются при появлении сети.
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  )
}
