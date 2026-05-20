import { useMemo, useState } from "react"
import { Check, ChevronLeft, FileText, Loader2, RefreshCw, Send, Truck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { DriverRoleSwitch } from "@/features/auth/ui/DriverRoleSwitch"
import { driverApplicationsApi } from "@/features/driver-application/api/driverApplicationsApi"
import { useMyDriverApplication, useSubmitDriverApplication } from "@/features/driver-application/api/useDriverApplications"
import {
  type DriverDocumentDraft,
  type DriverDocumentKey,
  useDriverApplicationDraftStore,
} from "@/features/driver-application/model/driver-application-draft-store"
import { useNetworkStore } from "@/features/offline/model/network-store"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Badge } from "@/shared/ui/badge/Badge"

type Step = "personal" | "documents" | "vehicle" | "review"

const docMeta: Record<DriverDocumentKey, { title: string; hint: string }> = {
  passport: {
    title: "Паспорт",
    hint: "Разворот с фото, без бликов",
  },
  license: {
    title: "Водительские права",
    hint: "Лицевая сторона",
  },
  sts: {
    title: "СТС",
    hint: "Свидетельство о регистрации",
  },
}

export const DriverApplyPage = () => {
  const navigate = useNavigate()
  const isOnline = useNetworkStore((s) => s.isOnline)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const draft = useDriverApplicationDraftStore((s) => s.draft)
  const setPersonal = useDriverApplicationDraftStore((s) => s.setPersonal)
  const setVehicle = useDriverApplicationDraftStore((s) => s.setVehicle)
  const setDocument = useDriverApplicationDraftStore((s) => s.setDocument)
  const patchDocument = useDriverApplicationDraftStore((s) => s.patchDocument)
  const touchSaved = useDriverApplicationDraftStore((s) => s.touchSaved)

  const [step, setStep] = useState<Step>("personal")
  const { data: myApp } = useMyDriverApplication()
  const submit = useSubmitDriverApplication()

  const vehicleSummary = useMemo(() => {
    const v = draft.vehicle
    const parts = [
      [v.brand, v.model].filter(Boolean).join(" "),
      v.plate,
      v.capacityKg ? `${v.capacityKg}кг` : "",
      v.volumeM3 ? `${v.volumeM3}м³` : "",
      v.bodyType,
    ].filter(Boolean)
    return parts.join(" · ")
  }, [draft.vehicle])

  const canNextPersonal =
    draft.personal.fullName.trim().length >= 5 &&
    Boolean(draft.personal.birthDate) &&
    Boolean(draft.personal.phone.trim()) &&
    Boolean(draft.personal.email.trim())

  const docsOk = Boolean(draft.documents.passport && draft.documents.license && draft.documents.sts)

  const canNextVehicle =
    draft.vehicle.brand.trim() &&
    draft.vehicle.model.trim() &&
    draft.vehicle.plate.trim() &&
    draft.vehicle.capacityKg.trim() &&
    draft.vehicle.volumeM3.trim() &&
    draft.vehicle.bodyType.trim()

  const onPickFile = async (key: DriverDocumentKey, file: File) => {
    const previewUrl = URL.createObjectURL(file)
    const doc: DriverDocumentDraft = {
      key,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      previewUrl,
      status: "uploading",
      progress: 0,
    }
    setDocument(key, doc)
    touchSaved()

    try {
      patchDocument(key, { progress: 30 })
      const uploaded = await driverApplicationsApi.uploadDocument(key, file)
      patchDocument(key, {
        status: "uploaded",
        progress: 100,
        previewUrl: uploaded.url,
        error: undefined,
      })
      touchSaved()
    } catch (e) {
      patchDocument(key, {
        status: "failed",
        error: e instanceof Error ? e.message : "Не удалось загрузить",
      })
      touchSaved()
    }
  }

  const onRetryUpload = async (key: DriverDocumentKey) => {
    const existing = draft.documents[key]
    if (!existing) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void onPickFile(key, file)
    }
    input.click()
  }

  const onSubmit = async () => {
    if (!user) return
    await submit.mutateAsync({
      userId: user.id,
      vehicleSummary: vehicleSummary || "—",
    })
    navigate(routes.profile)
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-sm font-semibold text-slate-900">Нужен вход</p>
          <p className="mt-1 text-sm text-slate-600">
            Чтобы подать заявку водителя, войдите по email.
          </p>
          <div className="mt-3">
            <Link to={routes.auth} className="text-sm font-semibold text-blue-700">
              Перейти к входу
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (myApp?.status === "approved") {
    return (
      <div className="flex flex-col gap-4 p-4 pb-8">
        <PageHeader
          title="Стать водителем"
          subtitle="Заявка одобрена — переключайте режим интерфейса"
          backTo={routes.profile}
        />

        <Card className="border-emerald-200 bg-emerald-50/40">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Статус заявки</p>
              <p className="mt-1 text-sm text-slate-600">
                Одобрено — доступен интерфейс водителя и маршруты.
              </p>
            </div>
            <Badge variant="success">approved</Badge>
          </div>
        </Card>

        <DriverRoleSwitch navigateOnSwitch />
      </div>
    )
  }

  if (myApp?.status === "pending") {
    return (
      <div className="flex flex-col gap-4 p-4 pb-8">
        <PageHeader
          title="Стать водителем"
          subtitle="Заявка отправлена и ожидает проверки"
          backTo={routes.profile}
        />

        <Card className="border-amber-200 bg-amber-50/40">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Статус заявки</p>
              <p className="mt-1 text-sm text-slate-600">
                На проверке. После одобрения здесь появится переключатель роли водителя.
              </p>
            </div>
            <Badge variant="warning">pending</Badge>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title="Стать водителем"
        subtitle="Заявка с автосохранением и проверкой документов"
        backTo={routes.profile}
      />

      {!isOnline ? (
        <Card className="border-amber-200 bg-amber-50/40">
          <p className="text-sm font-semibold text-slate-900">Вы офлайн</p>
          <p className="mt-1 text-sm text-slate-600">
            Черновик сохранится. Отправка заявки — при появлении сети.
          </p>
        </Card>
      ) : null}

      {myApp?.status === "rejected" ? (
        <Card className="border-slate-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Статус заявки</p>
              <p className="mt-1 text-sm text-slate-600">
                Отклонено — исправьте данные и отправьте заново
              </p>
              {myApp.rejectionReason ? (
                <p className="mt-2 text-sm font-medium text-amber-800">
                  Причина: {myApp.rejectionReason}
                </p>
              ) : null}
            </div>
            <Badge variant="danger">rejected</Badge>
          </div>
        </Card>
      ) : null}

      <Card className="border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStep((s) =>
                  s === "documents" ? "personal" : s === "vehicle" ? "documents" : s === "review" ? "vehicle" : s,
                )
              }
              className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              aria-label="Назад"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-semibold text-slate-900">
              Шаг:{" "}
              {step === "personal"
                ? "Личные данные"
                : step === "documents"
                  ? "Документы"
                  : step === "vehicle"
                    ? "Авто"
                    : "Проверка"}
            </p>
          </div>
          {draft.lastSavedAt ? (
            <p className="text-xs text-slate-500">Автосохранено</p>
          ) : null}
        </div>
      </Card>

      {step === "personal" ? (
        <Card className="border-slate-200">
          <div className="grid gap-3">
            <Input
              label="ФИО"
              value={draft.personal.fullName}
              onChange={(e) => {
                setPersonal({ fullName: e.target.value })
                touchSaved()
              }}
              placeholder="Иванов Иван Иванович"
              autoComplete="name"
            />
            <Input
              label="Дата рождения"
              type="date"
              value={draft.personal.birthDate}
              onChange={(e) => {
                setPersonal({ birthDate: e.target.value })
                touchSaved()
              }}
            />
            <Input
              label="Телефон"
              value={draft.personal.phone}
              onChange={(e) => {
                setPersonal({ phone: e.target.value })
                touchSaved()
              }}
              placeholder="+7 (___) ___-__-__"
              autoComplete="tel"
            />
            <Input
              label="Email"
              type="email"
              value={draft.personal.email}
              onChange={(e) => {
                setPersonal({ email: e.target.value })
                touchSaved()
              }}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div className="mt-4">
            <Button
              type="button"
              fullWidth
              disabled={!canNextPersonal}
              rightIcon={<Check size={16} />}
              onClick={() => setStep("documents")}
            >
              Продолжить
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "documents" ? (
        <Card className="border-slate-200">
          <div className="space-y-3">
            {(Object.keys(docMeta) as DriverDocumentKey[]).map((k) => {
              const d = draft.documents[k]
              return (
                <div key={k} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{docMeta[k].title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{docMeta[k].hint}</p>
                      {d?.fileName ? (
                        <p className="mt-2 text-xs font-medium text-slate-700">{d.fileName}</p>
                      ) : null}
                    </div>
                    {d?.status === "uploaded" ? (
                      <Badge variant="success">uploaded</Badge>
                    ) : d?.status === "failed" ? (
                      <Badge variant="danger">failed</Badge>
                    ) : d?.status === "uploading" ? (
                      <Badge variant="info">uploading</Badge>
                    ) : (
                      <Badge>required</Badge>
                    )}
                  </div>

                  {d?.previewUrl ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img src={d.previewUrl} alt="" className="h-40 w-full object-cover" />
                    </div>
                  ) : null}

                  {d?.status === "uploading" ? (
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-600 transition-[width]"
                          style={{ width: `${d.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{d.progress}%</p>
                    </div>
                  ) : null}

                  {d?.status === "failed" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        leftIcon={<RefreshCw size={16} />}
                        onClick={() => onRetryUpload(k)}
                      >
                        Повторить
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDocument(k, null)}
                      >
                        Удалить
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50">
                      <FileText size={18} className="mr-2 text-blue-600" />
                      Загрузить фото
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          void onPickFile(k, file)
                        }}
                      />
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              fullWidth
              disabled={!docsOk}
              rightIcon={<Check size={16} />}
              onClick={() => setStep("vehicle")}
            >
              Продолжить
            </Button>
            <Button type="button" fullWidth variant="secondary" onClick={() => setStep("personal")}>
              Назад
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "vehicle" ? (
        <Card className="border-slate-200">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Марка"
                value={draft.vehicle.brand}
                onChange={(e) => {
                  setVehicle({ brand: e.target.value })
                  touchSaved()
                }}
                placeholder="Toyota"
              />
              <Input
                label="Модель"
                value={draft.vehicle.model}
                onChange={(e) => {
                  setVehicle({ model: e.target.value })
                  touchSaved()
                }}
                placeholder="HiAce"
              />
            </div>
            <Input
              label="Госномер"
              value={draft.vehicle.plate}
              onChange={(e) => {
                setVehicle({ plate: e.target.value.toUpperCase() })
                touchSaved()
              }}
              placeholder="А123ВС14"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Грузоподъемность (кг)"
                inputMode="numeric"
                value={draft.vehicle.capacityKg}
                onChange={(e) => {
                  setVehicle({ capacityKg: e.target.value })
                  touchSaved()
                }}
                placeholder="1200"
              />
              <Input
                label="Объем кузова (м³)"
                inputMode="decimal"
                value={draft.vehicle.volumeM3}
                onChange={(e) => {
                  setVehicle({ volumeM3: e.target.value })
                  touchSaved()
                }}
                placeholder="6.5"
              />
            </div>
            <Input
              label="Тип кузова"
              value={draft.vehicle.bodyType}
              onChange={(e) => {
                setVehicle({ bodyType: e.target.value })
                touchSaved()
              }}
              placeholder="фургон / бортовой / рефрижератор"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              fullWidth
              disabled={!canNextVehicle}
              rightIcon={<Check size={16} />}
              onClick={() => setStep("review")}
            >
              Продолжить
            </Button>
            <Button type="button" fullWidth variant="secondary" onClick={() => setStep("documents")}>
              Назад
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "review" ? (
        <Card className="border-slate-200">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Проверка заявки</p>
              <p className="mt-1 text-sm text-slate-600">
                Проверьте данные. После отправки статус станет <span className="font-semibold">pending</span>.
              </p>
              <p className="mt-2 text-xs font-medium text-slate-700">
                Авто: {vehicleSummary || "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              fullWidth
              disabled={submit.isPending}
              leftIcon={submit.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              onClick={() => void onSubmit()}
            >
              Отправить на проверку
            </Button>
            <Button type="button" fullWidth variant="secondary" onClick={() => setStep("vehicle")}>
              Назад
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

