import { useAuthStore } from "@/app/model/auth-store"
import { useMyDriverApplication } from "@/features/driver-application/api/useDriverApplications"
import { MobilePageLayout } from "@/shared/ui/mobile-page-layout/MobilePageLayout"
import { PageShell } from "@/shared/ui/page-shell/PageShell"

import { DriverApplyApproved } from "./DriverApplyApproved"
import { DriverApplyGuest } from "./DriverApplyGuest"
import { DriverApplyPending } from "./DriverApplyPending"
import { DriverApplyWizard } from "./DriverApplyWizard"

export const DriverApplyPage = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: myApp } = useMyDriverApplication()

  let content
  if (!isAuthenticated) {
    content = <DriverApplyGuest />
  } else if (myApp?.status === "approved") {
    content = <DriverApplyApproved />
  } else if (myApp?.status === "pending") {
    content = <DriverApplyPending />
  } else {
    content = <DriverApplyWizard myApp={myApp ?? undefined} />
  }

  return (
    <MobilePageLayout>
      <PageShell className="!pb-8">{content}</PageShell>
    </MobilePageLayout>
  )
}
