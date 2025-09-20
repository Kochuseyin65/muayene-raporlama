export interface FetchPdfResult {
  blob: Blob
  filename?: string | null
  usedIndex: number
}

const parseFilename = (contentDisposition?: string | null) => {
  if (!contentDisposition) return undefined
  const filenameStarMatch = /filename\*=(?:UTF-8''|)([^;]+)/i.exec(contentDisposition)
  if (filenameStarMatch && filenameStarMatch[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].trim().replace(/^"|"$/g, ''))
    } catch (_) {
      return filenameStarMatch[1].trim()
    }
  }
  const filenameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition)
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1]
  }
  return undefined
}

export const fetchPdfWithFallback = async (urls: string[], init?: RequestInit): Promise<FetchPdfResult | null> => {
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i]
    try {
      const response = await fetch(url, init)
      if (response.ok) {
        const blob = await response.blob()
        const filename = parseFilename(response.headers.get('Content-Disposition'))
        return { blob, filename, usedIndex: i }
      }
      if (response.status === 404) {
        continue
      }
      const text = await response.text().catch(() => '')
      throw new Error(text || `PDF isteği başarısız (status: ${response.status})`)
    } catch (error) {
      if (i === urls.length - 1) {
        throw error
      }
    }
  }
  return null
}

export const triggerDownload = (blob: Blob, filename = 'rapor.pdf') => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
