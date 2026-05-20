import { useMemo, useState } from "react"
import { Check, FileText, X } from "lucide-react"

import {
  useAdminDriverApplications,
  useSetDriverApplicationStatus,
} from "@/features/driver-application/api/useDriverApplications"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Badge } from "@/shared/ui/badge/Badge"

const statusLabel = {
  pending: "На проверке",
  approved: "Одобрено",
  rejected: "Отклонено",
} as const

const statusVariant = {
  pending: "warning" as const,
  approved: "success" as const,
  rejected: "danger" as const,
}

const docTypeLabel: Record<string, string> = {
  passport: "Паспорт",
  license: "Водительские права",
  sts: "СТС",
  vehicle: "Фото авто",
  selfie: "Селфи",
}

export const AdminDriverApplicationsPage = () => {
  const { data } = useAdminDriverApplications()
  const setStatus = useSetDriverApplicationStatus()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState("")

  const list = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const withUser = (data ?? []).map((x) => ({ a: x, user: x.user }))
    if (!q) return withUser
    return withUser.filter(({ a, user }) => {
      const hay = [
        a.id,
        a.status,
        a.vehicleSummary ?? "",
        user?.name ?? "",
        user?.phone ?? "",
        user?.email ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [data, filter])

  const selected = list.find((x) => x.a.id === selectedId) ?? list[0]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Заявки водителей"
        subtitle="Проверка документов и решение по статусу"
      />

      <Card className="border-slate-200">
        <Input
          label="Поиск"
          placeholder="Имя, email, машина, статус…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </Card>

      {list.length === 0 ? (
        <EmptyState icon={FileText} title="Заявок нет" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card padding="none" className="overflow-hidden border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Очередь проверок
              </p>
              <p className="text-xs text-slate-500">
                {list.length} заявок
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {list.map(({ a, user }) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full px-4 py-3 text-left transition ${
                      a.id === selected?.a.id
                        ? "bg-blue-50/60"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user?.name ?? "Пользователь"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {a.vehicleSummary ?? "—"}
                        </p>
                      </div>
                      <Badge variant={statusVariant[a.status]}>
                        {statusLabel[a.status]}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-slate-200">
            {selected ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Данные водителя
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <p>
                      <span className="text-slate-500">Имя:</span>{" "}
                      <span className="font-medium text-slate-900">
                        {selected.user?.name ?? "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Телефон:</span>{" "}
                      {selected.user?.phone ?? "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">Email:</span>{" "}
                      {selected.user?.email ?? "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">Авто:</span>{" "}
                      {selected.a.vehicleSummary ?? "—"}
                    </p>
                    {selected.a.status === "rejected" ? (
                      <p>
                        <span className="text-slate-500">Причина:</span>{" "}
                        <span className="font-medium text-amber-700">
                          {selected.a.rejectionReason ?? "—"}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="!bg-emerald-600 hover:!bg-emerald-500"
                      leftIcon={<Check size={16} />}
                      disabled={!selected || setStatus.isPending}
                      onClick={() => {
                        if (!selected) return
                        setStatus.mutate({ id: selected.a.id, status: "approved" })
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      leftIcon={<X size={16} />}
                      disabled={!selected || setStatus.isPending}
                      onClick={() => {
                        if (!selected) return
                        const reason = window.prompt("Причина отказа?") ?? ""
                        setStatus.mutate({
                          id: selected.a.id,
                          status: "rejected",
                          reason: reason.trim() || "Не указано",
                        })
                      }}
                    >
                      Reject (причина)
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">Документы</p>
                  {(selected.a.documents ?? []).length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selected.a.documents!.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={doc.url}
                            alt={docTypeLabel[doc.type] ?? doc.type}
                            className="aspect-[4/3] w-full object-contain"
                          />
                          <p className="border-t border-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                            {docTypeLabel[doc.type] ?? doc.type}
                            {doc.fileName ? ` · ${doc.fileName}` : ""}
                          </p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-amber-700">
                      Документы не загружены (заявка подана до включения загрузки в MinIO).
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  )
}

