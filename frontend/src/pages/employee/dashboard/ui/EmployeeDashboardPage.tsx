import { CheckCircle2, Package, WifiOff } from "lucide-react"

import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"

export const EmployeeDashboardPage = () => {
  return (
    <PageShell>
      <PageHeader
        title="Сводка"
        subtitle="Быстрые действия для выдачи в ПВЗ"
      />

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Package size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Доставлено</p>
              <p className="text-xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Выдано сегодня</p>
              <p className="text-xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/40">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <WifiOff size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Offline-режим</p>
            <p className="mt-1 text-sm text-slate-600">
              Выдача должна работать без сети: локальные действия в очереди и
              синхронизация при восстановлении соединения.
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  )
}

