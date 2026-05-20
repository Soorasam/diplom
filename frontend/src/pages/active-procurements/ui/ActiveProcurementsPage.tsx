import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle2, Lock, Package } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurements,
  useJoinProcurement,
  useMyProcurementMemberships,
} from "@/entities/procurement/api/useProcurements"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { ProcurementCard } from "@/widgets/procurement-card/ui/ProcurementCard"

export const ActiveProcurementsPage = () => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: procurements, isLoading } = useActiveProcurements()
  const { data: memberships = [] } = useMyProcurementMemberships(user?.id)
  const join = useJoinProcurement(user?.id)

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title="Активные сборы"
        subtitle="Присоединяйтесь к ближайшему сбору и следите за прогрессом"
        backTo={routes.home}
      />

      {!isAuthenticated ? (
        <Card className="border-amber-200 bg-amber-50/40">
          <p className="text-sm font-semibold text-slate-900">Нужен вход</p>
          <p className="mt-1 text-sm text-slate-600">
            Войдите по email, чтобы присоединиться к сбору.
          </p>
          <div className="mt-3">
            <Link to={routes.auth} className="text-sm font-semibold text-blue-700">
              Перейти ко входу
            </Link>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : procurements && procurements.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {procurements.map((p) => {
            const joined = memberships.includes(p.id)
            return (
              <li key={p.id}>
                <Card padding="none" className="overflow-hidden border-slate-200">
                  <div className="p-3">
                    <ProcurementCard procurement={p} />
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50 px-3 py-3">
                    {joined ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 size={16} />
                          Вы уже участвуете в этом сборе
                        </p>
                        <Link
                          to={routes.catalog}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                        >
                          В каталог
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        fullWidth
                        disabled={!isAuthenticated || join.isPending}
                        leftIcon={!isAuthenticated ? <Lock size={16} /> : <Package size={16} />}
                        onClick={() => join.mutate(p.id)}
                      >
                        Присоединиться к сбору
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Package}
          title="Сборов пока нет"
          description="Новые сборы появятся здесь"
        />
      )}
    </div>
  )
}

