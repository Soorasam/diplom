import { Check } from "lucide-react"

import { useDriverDocumentUpload } from "@/features/driver-application/hooks/useDriverDocumentUpload"
import { driverDocumentKeys } from "@/features/driver-application/model/doc-meta"
import { useDriverApplicationDraftStore } from "@/features/driver-application/model/driver-application-draft-store"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"

import { DocumentUploadCard } from "./DocumentUploadCard"

type Props = {
  canContinue: boolean
  onContinue: () => void
  onBack: () => void
}

export const DocumentsStep = ({ canContinue, onContinue, onBack }: Props) => {
  const documents = useDriverApplicationDraftStore((s) => s.draft.documents)
  const setDocument = useDriverApplicationDraftStore((s) => s.setDocument)
  const { pickFile, retryUpload } = useDriverDocumentUpload()

  return (
    <Card className="border-slate-200">
      <div className="space-y-3">
        {driverDocumentKeys.map((key) => (
          <DocumentUploadCard
            key={key}
            docKey={key}
            doc={documents[key]}
            onPickFile={(k, file) => void pickFile(k, file)}
            onRetry={retryUpload}
            onRemove={(k) => setDocument(k, null)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          fullWidth
          disabled={!canContinue}
          rightIcon={<Check size={16} />}
          onClick={onContinue}
        >
          Продолжить
        </Button>
        <Button type="button" fullWidth variant="secondary" onClick={onBack}>
          Назад
        </Button>
      </div>
    </Card>
  )
}
