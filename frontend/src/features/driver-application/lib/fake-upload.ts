export async function fakeUpload(
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return await new Promise((resolve, reject) => {
    let pct = 0
    const step = () => {
      if (signal?.aborted) {
        reject(new Error("upload aborted"))
        return
      }
      pct = Math.min(100, pct + 8 + Math.random() * 12)
      onProgress(Math.round(pct))
      if (pct >= 100) {
        resolve()
        return
      }
      setTimeout(step, 120)
    }
    setTimeout(step, 150)
  })
}

