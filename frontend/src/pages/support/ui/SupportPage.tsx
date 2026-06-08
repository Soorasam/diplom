import { Headphones, Mail, Phone } from "lucide-react"

import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"

const faq = [
  {
    q: "Как работает оплата?",
    a: "После оформления заказа вы оплачиваете в приложении — средства резервируются на платформе (эскроу). Водитель закупает товар на свои деньги. После проверки товара на выдаче нажмите «Товар получен» — тогда водитель получит выплату.",
  },
  {
    q: "Нужно ли платить водителю на месте?",
    a: "Нет. На общей точке раздачи водитель только вручает товар. Подтверждение получения и выплата — в приложении.",
  },
  {
    q: "Когда заказ отменяется?",
    a: "Автоматически: если до закрытия сбора вы не оплатили заказ; если сбор закрыли с недостаточным числом участников; если водитель отметил товар «нет в наличии» при закупке. Неоплата не связана с тем, что водитель не нажал «Принять в рейс» — оплаченные заказы остаются в сборе.",
  },
  {
    q: "Почему цена в каталоге может отличаться от чека?",
    a: "Цена в каталоге — ориентир до закупа. После закупа водитель прикрепляет чеки и вводит фактическую сумму; переплата пропорционально возвращается жителям на платформе. При споре администратор смотрит чеки сбора.",
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
    a: "На общей точке раздачи в вашем посёлке. Время и место сообщит водитель — устно, по телефону или при встрече. Статус заказа виден в приложении.",
  },
  {
    q: "Как найти активный сбор?",
    a: "Откройте раздел «Активные сборы» в приложении — водитель открывает сбор сам, приглашения по ссылке не нужны.",
  },
]

export const SupportPage = () => {
  const profileRoutes = useProfileRoutes()

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Поддержка" backTo={profileRoutes.profile} />

      <Card className="border-blue-100 bg-blue-50/40">
        <div className="flex items-center gap-3">
          <span className="ui-icon-soft flex h-10 w-10 shrink-0 rounded-xl">
            <Headphones size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Служба поддержки</p>
            <p className="text-xs text-slate-600">Пн–Пт 9:00–18:00 (Якутск)</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <a href="tel:+74112456789" className="ui-link flex items-center gap-2">
            <Phone size={16} />
            +7 (4112) 45-67-89
          </a>
          <a href="mailto:support@coopykt.ru" className="ui-link flex items-center gap-2">
            <Mail size={16} />
            support@coopykt.ru
          </a>
        </div>
      </Card>

      <div>
        <p className="ui-section-title mb-3">Частые вопросы</p>
        <ul className="flex flex-col gap-3">
          {faq.map((item) => (
            <li key={item.q}>
              <Card className="!p-4">
                <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
