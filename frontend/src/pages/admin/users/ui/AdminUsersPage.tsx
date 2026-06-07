import { Users } from "lucide-react"

import { useAdminUsers } from "@/entities/admin/api/useAdmin"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

import type { UserRole } from "@/shared/types"

const roleLabel: Record<UserRole, string> = {
  client: "Клиент",
  driver: "Водитель",
  employee: "Сотрудник (устар.)",
  admin: "Администратор",
}

const roleVariant: Record<UserRole, "default" | "info" | "warning" | "success"> = {
  client: "default",
  driver: "info",
  employee: "success",
  admin: "warning",
}

export const AdminUsersPage = () => {
  const { data: users, isLoading } = useAdminUsers()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Пользователи" subtitle="Клиенты, водители и администраторы" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : users && users.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Телефон</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant[u.role]}>{roleLabel[u.role]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {users.map((u) => (
              <Card key={u.id}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.phone}</p>
                  </div>
                  <Badge variant={roleVariant[u.role]}>{roleLabel[u.role]}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={Users} title="Пользователей нет" />
      )}
    </div>
  )
}
