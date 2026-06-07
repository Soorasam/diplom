import { Headphones, Mail, Phone } from "lucide-react"

import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"

const faq = [
  {
    q: "Как работает оплата?",
    a: "После оформления заказа вы оплачиваете в приложении — средства резервируются на платформе (эскроу). Координатор закупает товар на свои деньги. После проверки товара на выдаче нажмите «Товар получен» — тогда координатор получит выплату.",
  },
  {
    q: "Нужно ли платить координатору на месте?",
    a: "Нет. На общей точке раздачи координатор только вручает товар. Подтверждение получения и выплата — в приложении.",
  },
  {
    q: "Когда заказ отменяется?",
    a: "Автоматически: если до закрытия сбора вы не оплатили заказ; если сбор закрыли с недостаточным числом участников; если координатор отметил товар «нет в наличии» при закупке. Неоплата не связана с тем, что координатор не нажал «Принять в рейс» — оплаченные заказы остаются в сборе.",
  },
  {
    q: "Почему цена в каталоге может отличаться от чека?",
    a: "Цена в каталоге — ориентир до закупа. После закупа координатор прикрепляет чеки и вводит фактическую сумму; переплата пропорционально возвращается жителям на платформе. При споре администратор смотрит чеки сбора.",
  },
  {
    q: "Как формируется цена доставки?",
    a: "Стоимость логистики распределяется между участниками сбора пропорционально объёму заказа.",
  },
  {
    q: "Почему сроки могут сдвигаться?",
    a: "Зимники, погода и ледовые переправы влияют на маршруты. Статус заказа обновляется в приложении.",
  },
  {
    q: "Где забрать заказ?",
    a: "На общей точке раздачи в вашем посёлке. Время и место сообщит координатор — устно, по телефону или при встрече. Статус заказа виден в приложении.",
  },
  {
    q: "Как найти активный сбор?",
    a: "Откройте раздел «Активные сборы» в приложении — координатор открывает сбор сам, приглашения по ссылке не нужны.",
  },
]

export const SupportPage = () => {
  const profileRoutes = useProfileRoutes()

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Поддержка" backTo={profileRoutes.profile} />

      <Card className="border-blue-100 bg-blue-50/40">
        <div className="flex items-center gap-3">
          <Headphones className="text-blue-600" size={24} />
          <div>
            <p className="font-semibold text-slate-900">Служба поддержки</p>
            <p className="text-sm text-slate-600">Пн–Пт, 9:00–18:00 (Якутск)</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-slate-700">
            <Phone size={16} className="text-blue-600" />
            +7 (4112) 000-00-00
          </p>
          <p className="flex items-center gap-2 text-slate-700">
            <Mail size={16} className="text-blue-600" />
            support@coop-yakutia.ru
          </p>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Частые вопросы</h2>
        <ul className="flex flex-col gap-3">
          {faq.map((item) => (
            <li key={item.q}>
              <Card>
                <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
