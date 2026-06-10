import { Link, useParams } from "react-router-dom"
import { Truck } from "lucide-react"

import { useAdminDriver } from "@/entities/admin/api/useAdmin"
import { DriverDocumentsGallery } from "@/features/driver-application/ui/DriverDocumentsGallery"
import { routes } from "@/shared/config/routes"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const appStatusLabel: Record<string, string> = {
  draft: "Черновик",
  pending: "На проверке",
  approved: "Одобрено",
  rejected: "Отклонено",
}

export const AdminDriverDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: driver, isLoading, isError } = useAdminDriver(id)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (isError || !driver) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Водитель" backTo={routes.admin.drivers} />
        <EmptyState icon={Truck} title="Водитель не найден" />
      </div>
    )
  }

  const app = driver.application

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={driver.name} subtitle="Данные водителя" backTo={routes.admin.drivers} />

      <Card>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Телефон</dt>
            <dd className="font-semibold text-slate-900">{driver.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Email</dt>
            <dd className="font-semibold text-slate-900">{driver.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Населённый пункт</dt>
            <dd className="font-semibold text-slate-900">
              {driver.settlement?.name ?? "—"}
              {driver.settlement?.ulus ? ` · ${driver.settlement.ulus}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">В системе с</dt>
            <dd className="font-semibold text-slate-900">
              {formatShortDate(driver.createdAt)}
            </dd>
          </div>
        </dl>
      </Card>

      {app ? (
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">Заявка водителя</p>
            <Badge variant={app.status === "approved" ? "success" : "info"}>
              {appStatusLabel[app.status] ?? app.status}
            </Badge>
          </div>
          {app.vehicleSummary ? (
            <p className="mt-3 text-sm text-slate-700">{app.vehicleSummary}</p>
          ) : null}
          {app.submittedAt ? (
            <p className="mt-2 text-xs text-slate-500">
              Подана: {formatShortDate(app.submittedAt)}
            </p>
          ) : null}
          {app.rejectionReason ? (
            <p className="mt-2 text-sm text-red-700">{app.rejectionReason}</p>
          ) : null}
          {app.documents.length > 0 ? (
            <div className="mt-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">Документы</p>
              <DriverDocumentsGallery documents={app.documents} />
            </div>
          ) : null}
          <Link
            to={routes.admin.driverApplications}
            className="ui-link mt-4 inline-block text-xs font-semibold"
          >
            Все заявки водителей
          </Link>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">Одобренная заявка с документами не найдена.</p>
        </Card>
      )}
    </div>
  )
}
