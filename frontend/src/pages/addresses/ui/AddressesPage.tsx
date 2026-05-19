import { Check, MapPin } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import { routes } from "@/shared/config/routes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { cn } from "@/shared/lib/cn"

export const AddressesPage = () => {
  const user = useAuthStore((s) => s.user)
  const setSettlement = useAuthStore((s) => s.setSettlement)
  const { data: settlements, isLoading } = useSettlements()

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title="Населённый пункт"
        backTo={routes.profile}
        subtitle="От пункта зависят маршруты и пункты выдачи"
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {settlements?.map((s) => {
            const selected = user?.settlementId === s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSettlement(s.id)}
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
