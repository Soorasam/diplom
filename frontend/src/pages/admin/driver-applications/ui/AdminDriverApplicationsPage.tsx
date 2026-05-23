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
  const [rejectionReason, setRejectionReason] = useState("")
  const [openedDoc, setOpenedDoc] = useState<{ url: string; title: string } | null>(null)

  const filtered = useMemo(() => {
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

  const queue = filtered.filter((x) => x.a.status === "pending")
  const history = filtered.filter((x) => x.a.status !== "pending")
  const selected = queue.find((x) => x.a.id === selectedId) ?? queue[0] ?? null

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Заявки водителей"
        subtitle="Проверка документов и решение по статусу"
      />

      <Card>
        <Input
          label="Поиск"
          placeholder="Имя, email, машина, статус…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Заявок нет" />
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-6">
          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Очередь проверок
              </p>
              <p className="text-xs text-slate-500">
                {queue.length} заявок
              </p>
            </div>
            {queue.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">На проверке заявок нет.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {queue.map(({ a, user }) => (
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
                    </div>
                  </button>
                </li>
                ))}
              </ul>
            )}

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">История решений</p>
              <p className="text-xs text-slate-500">{history.length} заявок</p>
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">Пока нет обработанных заявок.</p>
            ) : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-auto">
                {history.map(({ a, user }) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {user?.name ?? "Пользователь"}
                      </p>
                      <Badge variant={statusVariant[a.status]}>{statusLabel[a.status]}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{a.vehicleSummary ?? "—"}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            {selected ? (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Данные водителя
                  </p>
                  <div className="mt-4 space-y-2.5 text-sm text-slate-700">
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

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      type="button"
                      className="bg-emerald-600! hover:bg-emerald-500!"
                      leftIcon={<Check size={16} />}
                      disabled={!selected || setStatus.isPending}
                      onClick={() => {
                        if (!selected) return
                        setStatus.mutate({ id: selected.a.id, status: "approved" })
                        setRejectionReason("")
                      }}
                    >
                      Одобрить
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      leftIcon={<X size={16} />}
                      disabled={
                        !selected || setStatus.isPending || rejectionReason.trim().length < 5
                      }
                      onClick={() => {
                        if (!selected) return
                        setStatus.mutate({
                          id: selected.a.id,
                          status: "rejected",
                          reason: rejectionReason.trim(),
                        })
                        setRejectionReason("")
                      }}
                    >
                      Отклонить
                    </Button>
                  </div>
                  <Input
                    className="mt-4"
                    label="Причина отказа (обязательно для reject)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Например: нечитаемое фото прав, нужна пересъёмка"
                  />
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-sm font-semibold text-slate-900">Документы</p>
                  {(selected.a.documents ?? []).length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {selected.a.documents!.map((doc) => (
                        <button
                          type="button"
                          key={doc.id}
                          onClick={() =>
                            setOpenedDoc({
                              url: doc.url,
                              title: `${docTypeLabel[doc.type] ?? doc.type}${doc.fileName ? ` · ${doc.fileName}` : ""}`,
                            })
                          }
                          className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={doc.url}
                            alt={docTypeLabel[doc.type] ?? doc.type}
                            className="aspect-4/3 w-full object-contain"
                          />
                          <p className="border-t border-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                            {docTypeLabel[doc.type] ?? doc.type}
                            {doc.fileName ? ` · ${doc.fileName}` : ""}
                          </p>
                        </button>
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

      {openedDoc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
          onClick={() => setOpenedDoc(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{openedDoc.title}</p>
              <Button type="button" variant="ghost" onClick={() => setOpenedDoc(null)}>
                Закрыть
              </Button>
            </div>
            <img src={openedDoc.url} alt={openedDoc.title} className="max-h-[75vh] w-full object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

