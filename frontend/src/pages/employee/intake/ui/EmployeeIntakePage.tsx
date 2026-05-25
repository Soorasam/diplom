import { Truck } from "lucide-react"

import { EmployeeIntakeChecklist } from "@/features/employee-intake/ui/EmployeeIntakeChecklist"
import {
  useEmployeeReceive,
  useEmployeeWorkspace,
} from "@/entities/employee/api/useEmployeeWorkspace"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const EmployeeIntakePage = () => {
  const { data: workspace, isLoading, isError, error } = useEmployeeWorkspace()
  const receive = useEmployeeReceive()

  const handleReceive = async (orderId: string, _roundId: string) => {
    const result = await receive.mutateAsync(orderId)
    return { stopCompleted: result?.stopCompleted }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      </PageShell>
    )
  }

  if (isError) {
    return (
      <PageShell>
        <PageHeader title="Приём от водителя" subtitle="Ошибка загрузки" />
        <EmptyState
          icon={Truck}
          title="Не удалось загрузить заказы"
          description={
            error instanceof Error ? error.message : "Проверьте связь с сервером и войдите снова"
          }
        />
      </PageShell>
    )
  }

  const groups = workspace?.intakeGroups ?? []

  return (
    <PageShell>
      <PageHeader
        title="Приём от водителя"
        subtitle="Чек-лист заказов на вашем ПВЗ"
      />

      {workspace?.hints && workspace.hints.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {workspace.hints.map((hint) => (
            <li
              key={hint}
              className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-900"
            >
              {hint}
            </li>
          ))}
        </ul>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Пока нечего принимать"
          description="Когда водитель привезёт заказы на ваш ПВЗ, здесь появится чек-лист: номер заказа, состав и кнопка приёма."
        />
      ) : workspace ? (
        <EmployeeIntakeChecklist
          workspace={workspace}
          onReceive={handleReceive}
          receivePending={receive.isPending}
        />
      ) : null}
    </PageShell>
  )
}
