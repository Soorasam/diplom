import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Check, MapPin } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import { queryKeys } from "@/shared/config/query-keys"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { cn } from "@/shared/lib/cn"

export const AddressesPage = () => {
  const profileRoutes = useProfileRoutes()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const updateSettlement = useAuthStore((s) => s.updateSettlement)
  const { data: settlements, isLoading } = useSettlements()
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleSelect = async (settlementId: string) => {
    setError(null)
    setSavingId(settlementId)
    try {
      await updateSettlement(settlementId)
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить посёлок")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title="Населённый пункт"
        backTo={profileRoutes.profile}
        subtitle="Куда координатор привезёт заказ при раздаче в посёлке"
      />

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {settlements?.map((s) => {
            const selected =
              user?.settlementId === s.id || user?.pickupPointId === s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={savingId === s.id}
                  onClick={() => void handleSelect(s.id)}
                  className="w-full text-left"
                >
                  <Card
                    className={cn(
                      "transition",
                      selected && "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={20}
                        className={selected ? "text-blue-600" : "text-slate-400"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.ulus} улус</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Население: {s.population.toLocaleString("ru-RU")}
                        </p>
                      </div>
                      {selected ? (
                        <Check size={20} className="shrink-0 text-blue-600" />
                      ) : null}
                    </div>
                  </Card>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
