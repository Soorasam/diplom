import { Link } from "react-router-dom"
import { ArrowRight, MapPin, ShoppingCart, Truck } from "lucide-react"

import type { DriverPhaseHero as HeroModel } from "@/shared/lib/driver-phase-hero"
import { cn } from "@/shared/lib/cn"

type Props = {
  hero: HeroModel
  hideFooter?: boolean
}

const phaseIcon = (phase: HeroModel["phase"]) => {
  if (phase === "procurement" || phase === "pre_delivery" || phase === "orders") {
    return ShoppingCart
  }
  if (phase.startsWith("delivery") || phase === "collection_open" || phase === "route") {
    return Truck
  }
  return MapPin
}

export const DriverPhaseHero = ({ hero, hideFooter }: Props) => {
  const Icon = phaseIcon(hero.phase)

  return (
    <div className="ui-phase-hero">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <span className="ui-phase-hero-icon">
            <Icon size={28} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ui-phase-hero-label">{hero.phaseLabel}</p>
            <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight">
              {hero.title}
            </h2>
            {hero.subtitle ? (
              <p className="ui-phase-hero-subtitle">{hero.subtitle}</p>
            ) : null}
          </div>
        </div>

        {hero.stats.length > 0 ? (
          <div
            className={cn(
              "ui-phase-hero-divider mt-5 grid gap-2 border-t pt-4",
              hero.stats.length === 2 ? "grid-cols-2" : "grid-cols-3",
            )}
          >
            {hero.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="ui-phase-hero-stat-value">{stat.value}</p>
                <p className="ui-phase-hero-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {!hideFooter && hero.ctaLabel && hero.ctaTo ? (
        <div className="ui-phase-hero-footer flex items-center justify-between gap-3 px-5 py-3">
          <p className="ui-phase-hero-footer-hint min-w-0 truncate">
            {hero.nextLabel ?? "\u00a0"}
          </p>
          <Link
            to={hero.ctaTo}
            className="ui-cta-primary inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            {hero.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : hero.nextLabel ? (
        <div className="ui-phase-hero-footer px-5 py-3">
          <p className="ui-phase-hero-footer-hint truncate">{hero.nextLabel}</p>
        </div>
      ) : null}
    </div>
  )
}
