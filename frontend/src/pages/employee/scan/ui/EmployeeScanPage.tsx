import { QrCode } from "lucide-react"

import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"

export const EmployeeScanPage = () => {
  return (
    <PageShell>
      <PageHeader
        title="Сканер"
        subtitle="Сканируйте QR на заказе или у жителя"
      />

      <Card className="border-slate-200">
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <QrCode size={24} />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            Камера будет подключена позже
          </p>
          <p className="text-sm text-slate-600">
            UX: запрос разрешений, fallback на ручной ввод, офлайн‑подтверждения и
            очередь синхронизации.
          </p>
        </div>
      </Card>
    </PageShell>
  )
}

