import { useMyDriverApplication } from "@/features/driver-application/api/useDriverApplications"
import { useAuthStore } from "@/app/model/auth-store"

export type InterfaceMode = "resident" | "driver"


export const useCanUseDriverMode = () => {
  const user = useAuthStore((s) => s.user)
  const { data: myApp, isLoading } = useMyDriverApplication()

  const isDriverApproved = myApp?.status === "approved"
  const canUseDriverMode = Boolean(
    user && (isDriverApproved || user.role === "driver"),
  )
  const activeMode: InterfaceMode =
    user?.role === "driver" ? "driver" : "resident"

  return {
    user,
    canUseDriverMode,
    activeMode,
    isDriverApproved,
    isLoading,
  }
}
