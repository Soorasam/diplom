import { useQuery } from "@tanstack/react-query"

import { employeeApi } from "@/entities/employee/api/employeeApi"
import { queryKeys } from "@/shared/config/query-keys"

/** @deprecated Роль сотрудника ПВЗ снята с продукта (вариант 4+1). */
export function useEmployeeWorkspace() {
  return useQuery({
    queryKey: queryKeys.employee.workspace,
    queryFn: () => employeeApi.getWorkspace(),
    enabled: false,
  })
}
