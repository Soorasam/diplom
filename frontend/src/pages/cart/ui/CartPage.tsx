import { Link } from "react-router-dom"

import { MapPin, Package, Pencil } from "lucide-react"

export const CartPage = () => {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Корзина сбора
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Товары группируются по маршруту. Итоговая стоимость с учётом логистики появится после
          закрытия сбора и подтверждения перевозчика.
        </p>
      </div>

      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 shrink-0 text-amber-800" size={20} />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-950">
              Пункт выдачи
            </p>

            <p className="mt-0.5 text-sm text-amber-900/85">
              с. Хандыга, Томпонский район — координатор Иванов А. (макет)
            </p>

            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline"
            >
              <Pencil size={12} />
              Изменить населённый пункт
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center">
        <Package className="mx-auto text-slate-300" size={40} strokeWidth={1.25} />

        <p className="mt-3 text-sm font-medium text-slate-700">
          Корзина пуста
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Добавьте товары из каталога — они попадут в текущий открытый сбор по вашему маршруту.
        </p>

        <Link
          to="/catalog"
          className="mt-4 inline-block rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Открыть каталог
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-800">
          Важно для отдалённых территорий
        </p>

        <p className="mt-2">
          Сроки могут сдвигаться из‑за погоды, пропускной способности зимников и ледовых
          переправ. Статус заказа и ориентировочная дата прибытия будут отображаться в разделе
          «Мои сборы».
        </p>
      </section>
    </div>
  )
}
