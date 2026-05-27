import { http } from "@/shared/api/client"
import type { DriverApplication, DriverApplicationDocument, User } from "@/shared/api/api-types"
import { mapBackendRole } from "@/shared/api/mappers"
import type { BackendUser } from "@/shared/api/backend-types"
import type { DriverDocumentKey } from "@/features/driver-application/model/driver-application-draft-store"
import type { DriverApplicationStatus } from "@/shared/types"

export type DriverApplicationWithUser = DriverApplication & {
  user: User | null
}

type BackendDoc = {
  id: string
  type: string
  url: string
  fileName?: string | null
  mimeType?: string | null
}

type BackendApp = {
  id: string
  userId: string
  status: DriverApplicationStatus
  vehicleSummary?: string | null
  rejectionReason?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  createdAt: string
  documents?: BackendDoc[]
  user?: BackendUser
}

const mapDoc = (d: BackendDoc): DriverApplicationDocument => ({
  id: d.id,
  type: d.type,
  url: d.url,
  fileName: d.fileName,
  mimeType: d.mimeType,
})

const mapApp = (a: BackendApp): DriverApplication => ({
  id: a.id,
  userId: a.userId,
  status: a.status,
  submittedAt: a.submittedAt ?? a.createdAt,
  reviewedAt: a.reviewedAt ?? undefined,
  rejectionReason: a.rejectionReason ?? undefined,
  vehicleSummary: a.vehicleSummary ?? undefined,
  documents: (a.documents ?? []).map(mapDoc),
})

export const driverApplicationsApi = {
  getByUser: async (_userId: string) => {
    const app = await http.get<BackendApp | null>("/driver-applications/me", true)
    return app ? mapApp(app) : null
  },

  uploadDocument: (type: DriverDocumentKey, file: File) =>
    http.upload<BackendDoc>(`/driver-applications/me/documents/${type}`, file, true).then(mapDoc),

  removeDocument: (type: DriverDocumentKey) =>
    http.delete(`/driver-applications/me/documents/${type}`, true),

  list: async (): Promise<DriverApplicationWithUser[]> => {
    const list = await http.get<BackendApp[]>("/driver-applications", true)
    return list.map((a) => ({
      ...mapApp(a),
      user: a.user
        ? {
            id: a.user.id,
            name: a.user.fullName ?? a.user.email,
            phone: a.user.phone ?? "",
            email: a.user.email,
            role: mapBackendRole(a.user.role),
            settlementId: a.user.settlementId ?? "",
          }
        : null,
    }))
  },

  submitDraft: (payload: { userId: string; vehicleSummary: string }) =>
    http
      .post<BackendApp>("/driver-applications", { vehicleSummary: payload.vehicleSummary }, true)
      .then(mapApp),

  setStatus: (id: string, status: DriverApplicationStatus, rejectionReason?: string) =>
    http
      .patch<BackendApp>(
        `/driver-applications/${id}`,
        { status, rejectionReason },
        true,
      )
      .then(mapApp),
}
