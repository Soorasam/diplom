import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { DriverApplicationStatus } from "@/shared/types"

export type DriverDocumentKey = "passport" | "license" | "sts"

export interface DriverDocumentDraft {
  key: DriverDocumentKey
  fileName: string
  mimeType: string
  size: number
  previewUrl?: string
  status: "idle" | "uploading" | "uploaded" | "failed"
  progress: number
  error?: string
}

export interface DriverApplicationDraft {
  personal: {
    fullName: string
    birthDate: string
    phone: string
    email: string
  }
  vehicle: {
    brand: string
    model: string
    plate: string
    capacityKg: string
    volumeM3: string
    bodyType: string
  }
  documents: Record<DriverDocumentKey, DriverDocumentDraft | null>
  status?: DriverApplicationStatus
  rejectionReason?: string
  lastSavedAt?: string
}

interface DraftState {
  draft: DriverApplicationDraft
  setPersonal: (patch: Partial<DriverApplicationDraft["personal"]>) => void
  setVehicle: (patch: Partial<DriverApplicationDraft["vehicle"]>) => void
  setDocument: (key: DriverDocumentKey, doc: DriverDocumentDraft | null) => void
  patchDocument: (key: DriverDocumentKey, patch: Partial<DriverDocumentDraft>) => void
  setReviewStatus: (status: DriverApplicationStatus, rejectionReason?: string) => void
  clear: () => void
  clearDocuments: () => void
  touchSaved: () => void
}

const emptyDraft: DriverApplicationDraft = {
  personal: { fullName: "", birthDate: "", phone: "", email: "" },
  vehicle: {
    brand: "",
    model: "",
    plate: "",
    capacityKg: "",
    volumeM3: "",
    bodyType: "",
  },
  documents: { passport: null, license: null, sts: null },
}

export const useDriverApplicationDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      draft: emptyDraft,
      setPersonal: (patch) =>
        set((s) => ({
          draft: { ...s.draft, personal: { ...s.draft.personal, ...patch } },
        })),
      setVehicle: (patch) =>
        set((s) => ({
          draft: { ...s.draft, vehicle: { ...s.draft.vehicle, ...patch } },
        })),
      setDocument: (key, doc) =>
        set((s) => ({
          draft: { ...s.draft, documents: { ...s.draft.documents, [key]: doc } },
        })),
      patchDocument: (key, patch) =>
        set((s) => ({
          draft: {
            ...s.draft,
            documents: {
              ...s.draft.documents,
              [key]: s.draft.documents[key]
                ? { ...s.draft.documents[key]!, ...patch }
                : s.draft.documents[key],
            },
          },
        })),
      setReviewStatus: (status, rejectionReason) =>
        set((s) => ({
          draft: { ...s.draft, status, rejectionReason },
        })),
      clear: () => set({ draft: emptyDraft }),
      clearDocuments: () =>
        set((s) => ({
          draft: {
            ...s.draft,
            documents: { passport: null, license: null, sts: null },
          },
        })),
      touchSaved: () =>
        set((s) => ({ draft: { ...s.draft, lastSavedAt: new Date().toISOString() } })),
    }),
    {
      name: "coop-driver-application-draft",
      version: 2,
      migrate: (persisted, _version) => {
        const state = persisted as { draft?: Partial<DriverApplicationDraft> }
        const draft = state.draft ?? {}
        return {
          draft: {
            ...emptyDraft,
            personal: { ...emptyDraft.personal, ...draft.personal },
            vehicle: { ...emptyDraft.vehicle, ...draft.vehicle },
            lastSavedAt: draft.lastSavedAt,
            documents: { passport: null, license: null, sts: null },
          },
        }
      },
      partialize: (state) => ({
        draft: {
          personal: state.draft.personal,
          vehicle: state.draft.vehicle,
          lastSavedAt: state.draft.lastSavedAt,
          documents: { passport: null, license: null, sts: null },
        },
      }),
    },
  ),
)

