import { Link } from "react-router-dom"
import { Truck } from "lucide-react"

import { useAdminDrivers } from "@/entities/admin/api/useAdmin"
import { routes } from "@/shared/config/routes"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminDriversPage = () => {
  const { data: drivers, isLoading } = useAdminDrivers()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Водители" subtitle="Экипажи и контакты" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : drivers && drivers.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {drivers.map((driver) => (
            <li key={driver.id}>
              <Link to={routes.admin.driver(driver.id)} className="block">
              <Card className="transition-colors hover:border-sky-200 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Truck size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{driver.name}</p>
                    <p className="text-xs text-slate-500">{driver.phone}</p>
                    <div className="mt-2">
                      <Badge variant="info">Водитель</Badge>
                    </div>
                  </div>
                </div>
              </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Truck} title="Водителей нет" />
      )}
    </div>
  )
}
