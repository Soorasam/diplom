import { useAuthStore } from "@/app/model/auth-store"
import { useMyDriverApplication } from "@/features/driver-application/api/useDriverApplications"

import { DriverApplyApproved } from "./DriverApplyApproved"
import { DriverApplyGuest } from "./DriverApplyGuest"
import { DriverApplyPending } from "./DriverApplyPending"
import { DriverApplyWizard } from "./DriverApplyWizard"

export const DriverApplyPage = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: myApp } = useMyDriverApplication()

  if (!isAuthenticated) {
    return <DriverApplyGuest />
  }

  if (myApp?.status === "approved") {
    return <DriverApplyApproved />
  }

  if (myApp?.status === "pending") {
    return <DriverApplyPending />
  }

  return <DriverApplyWizard myApp={myApp ?? undefined} />
}
