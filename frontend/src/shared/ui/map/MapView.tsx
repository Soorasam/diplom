import { MapPin, Navigation } from "lucide-react"

import type { MapMarker, MapRoute } from "@/shared/types"
import { cn } from "@/shared/lib/cn"

export interface MapViewProps {
  markers?: MapMarker[]
  routes?: MapRoute[]
  className?: string
  height?: string
  title?: string
  
  provider?: "mock" | "yandex" | "leaflet"
}


export const MapView = ({
  markers = [],
  routes = [],
  className,
  height = "220px",
  title = "Карта маршрута",
  provider = "mock",
}: MapViewProps) => (
  <section
    className={cn(
      "overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200",
      className,
    )}
    style={{ minHeight: height }}
    aria-label={title}
  >
    <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/70 px-3 py-2 backdrop-blur-sm">
      <span className="text-xs font-semibold text-slate-700">{title}</span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        {provider === "mock" ? "Демо-карта" : provider}
      </span>
    </div>

    <div className="relative flex flex-1 flex-col items-center justify-center p-4" style={{ minHeight: `calc(${height} - 40px)` }}>
      <Navigation className="text-blue-400/60" size={48} strokeWidth={1} />

      <p className="mt-2 text-center text-xs text-slate-500">
        {routes.length > 0
          ? `Маршрутов: ${routes.length}`
          : "Маршрут будет отображён после подключения карт"}
      </p>

      {markers.length > 0 ? (
        <ul className="mt-3 w-full max-w-xs space-y-1.5">
          {markers.slice(0, 4).map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-2 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300"
            >
              <MapPin size={14} className="shrink-0 text-blue-600" />
              <span className="truncate">{m.title}</span>
            </li>
          ))}
          {markers.length > 4 ? (
            <li className="text-center text-[10px] text-slate-400">
              +{markers.length - 4} точек
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  </section>
)
