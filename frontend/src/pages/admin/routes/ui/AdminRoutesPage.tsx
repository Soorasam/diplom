import { useState } from "react"
import { Route as RouteIcon, Plus } from "lucide-react"

import { useAdminRoutes, useCreateAdminRoute } from "@/entities/admin/api/useAdmin"
import type { CreateRoutePayload } from "@/entities/admin/api/adminApi"
import type { DeliveryRoute } from "@/shared/api/mock-db"
import type { DeliveryMode, MapMarker, MapRoute } from "@/shared/types"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { MapView } from "@/shared/ui/map/MapView"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const deliveryModeLabel: Record<DeliveryMode, string> = {
  winter_road: "Зимник",
  river: "Речной",
  air: "Авиа",
  mixed: "Автодорога",
}

const transportOptions: { value: CreateRoutePayload["transportType"]; label: string }[] = [
  { value: "winter_road", label: "Зимник" },
  { value: "river", label: "Речной" },
  { value: "highway", label: "Автодорога" },
]

export const AdminRoutesPage = () => {
  const { data: deliveryRoutesList, isLoading } = useAdminRoutes()
  const createRoute = useCreateAdminRoute()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [seasonNote, setSeasonNote] = useState("")
  const [transportType, setTransportType] =
    useState<CreateRoutePayload["transportType"]>("winter_road")
  const [formError, setFormError] = useState<string | null>(null)

  const canSubmit = title.trim().length >= 3 && !createRoute.isPending

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!canSubmit) return

    try {
      await createRoute.mutateAsync({
        title: title.trim(),
        transportType,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(seasonNote.trim() ? { seasonNote: seasonNote.trim() } : {}),
      })
      setTitle("")
      setDescription("")
      setSeasonNote("")
      setTransportType("winter_road")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось создать маршрут")
    }
  }

  const markers: MapMarker[] =
    deliveryRoutesList?.flatMap((route) =>
      route.points.map((point, i) => ({
        id: `${route.id}-${i}`,
        title: route.name,
        coordinates: point,
        type: "route" as const,
      })),
    ) ?? []

  const mapRoutes: MapRoute[] =
    deliveryRoutesList?.map((route) => ({
      id: route.id,
      name: route.name,
      points: route.points,
      color: "#64748b",
    })) ?? []

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Маршруты доставки"
        subtitle="Создайте маршрут — водитель выберет его при создании сбора"
      />

      <Card className="border-blue-100 bg-blue-50/30">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-900">Новый маршрут</p>

          <Input
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Якутск → Намцы"
            required
          />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Тип доставки</span>
            <select
              value={transportType}
              onChange={(e) =>
                setTransportType(e.target.value as CreateRoutePayload["transportType"])
              }
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {transportOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Сезонная доставка по зимнику"
          />

          <Input
            label="Сезон / примечание (необязательно)"
            value={seasonNote}
            onChange={(e) => setSeasonNote(e.target.value)}
            placeholder="Зимник — ноябрь–март"
          />

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <Button type="submit" leftIcon={<Plus size={16} />} disabled={!canSubmit}>
            {createRoute.isPending ? "Сохранение…" : "Добавить маршрут"}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : deliveryRoutesList && deliveryRoutesList.length > 0 ? (
        <>
          {markers.length > 0 ? (
            <MapView
              markers={markers}
              routes={mapRoutes}
              height="280px"
              title="Все маршруты"
            />
          ) : null}

          <ul className="flex flex-col gap-3">
            {deliveryRoutesList.map((route) => {
              const extra = route as AdminRouteView
              const mode =
                extra.transportType === "highway"
                  ? "mixed"
                  : (extra.deliveryMode as DeliveryMode)

              return (
                <li key={route.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{route.name}</p>
                        <p className="text-xs text-slate-500">{deliveryModeLabel[mode]}</p>
                        {extra.description ? (
                          <p className="mt-1 text-sm text-slate-600">{extra.description}</p>
                        ) : null}
                        {extra.seasonNote ? (
                          <p className="mt-0.5 text-xs text-slate-500">{extra.seasonNote}</p>
                        ) : null}
                      </div>
                      <Badge variant="warning">Шаблон</Badge>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={RouteIcon}
          title="Маршрутов нет"
          description="Создайте первый маршрут в форме выше"
        />
      )}
    </div>
  )
}

type AdminRouteView = DeliveryRoute & {
  description?: string | null
  seasonNote?: string | null
  transportType?: string
}
