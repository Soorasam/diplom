import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { useSubmitDriverApplication } from "@/features/driver-application/api/useDriverApplications"
import { buildVehicleSummary } from "@/features/driver-application/lib/build-vehicle-summary"
import { useDriverApplicationDraftStore } from "@/features/driver-application/model/driver-application-draft-store"
import { useNetworkStore } from "@/features/offline/model/network-store"
import type { DriverApplication } from "@/shared/api/mock-db"
import { routes } from "@/shared/config/routes"
import { isValidFullName, normalizeRuPhone } from "@/shared/lib/validation"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

import {
  type DriverApplyStep,
  prevDriverApplyStep,
} from "../model/driver-apply-step"
import { DriverApplyOfflineBanner } from "./DriverApplyOfflineBanner"
import { DriverApplyRejectedBanner } from "./DriverApplyRejectedBanner"
import { DriverApplyStepNav } from "./DriverApplyStepNav"
import { DocumentsStep } from "./steps/DocumentsStep"
import { PersonalStep } from "./steps/PersonalStep"
import { ReviewStep } from "./steps/ReviewStep"
import { VehicleStep } from "./steps/VehicleStep"

type Props = {
  myApp: DriverApplication | undefined
}

export const DriverApplyWizard = ({ myApp }: Props) => {
  const navigate = useNavigate()
  const isOnline = useNetworkStore((s) => s.isOnline)
  const user = useAuthStore((s) => s.user)
  const draft = useDriverApplicationDraftStore((s) => s.draft)
  const submit = useSubmitDriverApplication()

  const [step, setStep] = useState<DriverApplyStep>("personal")

  const vehicleSummary = useMemo(
    () => buildVehicleSummary(draft.vehicle),
    [draft.vehicle],
  )

  const canNextPersonal =
    isValidFullName(draft.personal.fullName) &&
    Boolean(draft.personal.birthDate) &&
    Boolean(normalizeRuPhone(draft.personal.phone)) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.personal.email.trim())

  const docsOk = Boolean(
    draft.documents.passport &&
      draft.documents.license &&
      draft.documents.sts,
  )

  const canNextVehicle = Boolean(
    draft.vehicle.brand.trim() &&
      draft.vehicle.model.trim() &&
      draft.vehicle.plate.trim() &&
      draft.vehicle.capacityKg.trim() &&
      draft.vehicle.volumeM3.trim() &&
      draft.vehicle.bodyType.trim(),
  )

  const goBack = () => {
    const prev = prevDriverApplyStep(step)
    if (prev) setStep(prev)
  }

  const onSubmit = async () => {
    if (!user) return
    await submit.mutateAsync({
      userId: user.id,
      vehicleSummary: vehicleSummary || "—",
    })
    navigate(routes.profile)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title="Стать водителем"
        subtitle="Заявка с автосохранением и проверкой документов"
        backTo={routes.profile}
      />

      {!isOnline ? <DriverApplyOfflineBanner /> : null}

      {myApp?.status === "rejected" ? (
        <DriverApplyRejectedBanner rejectionReason={myApp.rejectionReason} />
      ) : null}

      <DriverApplyStepNav
        step={step}
        lastSavedAt={draft.lastSavedAt}
        onBack={goBack}
      />

      {step === "personal" ? (
        <PersonalStep
          canContinue={canNextPersonal}
          onContinue={() => setStep("documents")}
        />
      ) : null}

      {step === "documents" ? (
        <DocumentsStep
          canContinue={docsOk}
          onContinue={() => setStep("vehicle")}
          onBack={() => setStep("personal")}
        />
      ) : null}

      {step === "vehicle" ? (
        <VehicleStep
          canContinue={canNextVehicle}
          onContinue={() => setStep("review")}
          onBack={() => setStep("documents")}
        />
      ) : null}

      {step === "review" ? (
        <ReviewStep
          vehicleSummary={vehicleSummary}
          isSubmitting={submit.isPending}
          onSubmit={() => void onSubmit()}
          onBack={() => setStep("vehicle")}
        />
      ) : null}
    </div>
  )
}
