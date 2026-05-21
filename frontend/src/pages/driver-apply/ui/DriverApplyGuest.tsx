import { Link } from "react-router-dom"

import { routes } from "@/shared/config/routes"
import { Card } from "@/shared/ui/card/Card"

export const DriverApplyGuest = () => (
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
