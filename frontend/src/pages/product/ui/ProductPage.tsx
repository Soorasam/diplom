import { Link, useParams } from "react-router-dom"

import { CalendarClock, MapPinned, Minus, Plus, Truck } from "lucide-react"

export const ProductPage = () => {
  const { id } = useParams()

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <Link
        to="/catalog"
        className="text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        ← Назад в каталог
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner">
        <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-200 to-teal-100/60">
          <Truck className="text-teal-700/40" size={64} strokeWidth={1.25} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Артикул {id ?? "—"}
        </p>

        <h1 className="mt-1 text-xl font-bold leading-snug text-slate-900">
          Условный товар для демонстрации карточки
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          В дипломной версии здесь будут фото, описание, вес и объём для расчёта доставки по
          зимнику или водному маршруту.
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
        <div className="flex items-start gap-2">
          <MapPinned className="mt-0.5 shrink-0 text-teal-700" size={18} />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Маршрут и пункт выдачи
            </p>

            <p className="text-xs text-slate-600">
              Выбор улуса и населённого пункта — на этапе оформления корзины (макет).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 shrink-0 text-teal-700" size={18} />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Сбор заказов
            </p>

            <p className="text-xs text-slate-600">
              Минимальная партия по маршруту и дата закрытия сбора отображаются здесь и в
              уведомлениях.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs text-slate-500">
            Цена за единицу (ориентир)
          </p>

          <p className="text-2xl font-bold tabular-nums text-slate-900">
            890 ₽
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:shadow-sm"
            aria-label="Меньше"
          >
            <Minus size={18} />
          </button>

          <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
            1
          </span>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:shadow-sm"
            aria-label="Больше"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <Link
        to="/cart"
        className="rounded-xl bg-teal-600 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-teal-700/25 transition hover:bg-teal-700"
      >
        Добавить в корзину сбора
      </Link>
    </div>
  )
}
