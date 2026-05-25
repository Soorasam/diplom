import { useCallback } from "react"

import { driverApplicationsApi } from "../api/driverApplicationsApi"
import {
  type DriverDocumentDraft,
  type DriverDocumentKey,
  useDriverApplicationDraftStore,
} from "../model/driver-application-draft-store"

const revokePreview = (url?: string) => {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url)
}

export const useDriverDocumentUpload = () => {
  const setDocument = useDriverApplicationDraftStore((s) => s.setDocument)
  const patchDocument = useDriverApplicationDraftStore((s) => s.patchDocument)
  const touchSaved = useDriverApplicationDraftStore((s) => s.touchSaved)

  const pickFile = useCallback(
    async (key: DriverDocumentKey, file: File) => {
      const prev = useDriverApplicationDraftStore.getState().draft.documents[key]
      revokePreview(prev?.previewUrl)

      const previewUrl = URL.createObjectURL(file)
      const doc: DriverDocumentDraft = {
        key,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        previewUrl,
        status: "uploading",
        progress: 0,
      }
      setDocument(key, doc)
      touchSaved()

      try {
        patchDocument(key, { progress: 30 })
        const uploaded = await driverApplicationsApi.uploadDocument(key, file)
        const baseUrl = uploaded.url
        const cacheBust = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
        patchDocument(key, {
          status: "uploaded",
          progress: 100,
          fileName: uploaded.fileName ?? file.name,
          previewUrl: cacheBust,
          error: undefined,
        })
        revokePreview(previewUrl)
        touchSaved()
      } catch (e) {
        patchDocument(key, {
          status: "failed",
          error: e instanceof Error ? e.message : "Не удалось загрузить",
        })
        touchSaved()
      }
    },
    [patchDocument, setDocument, touchSaved],
  )

  const detachDocument = useCallback(
    async (key: DriverDocumentKey) => {
      const current = useDriverApplicationDraftStore.getState().draft.documents[key]
      revokePreview(current?.previewUrl)
      setDocument(key, null)
      try {
        await driverApplicationsApi.removeDocument(key)
      } catch {
        void 0
      }
      touchSaved()
    },
    [setDocument, touchSaved],
  )

  const retryUpload = useCallback(
    (key: DriverDocumentKey) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = () => {
        const file = input.files?.[0]
        if (file) void pickFile(key, file)
      }
      input.click()
    },
    [pickFile],
  )

  return { pickFile, retryUpload, detachDocument }
}
