/** Metin ve görsel paylaşımı. Cihazda Filesystem cache + Share; tarayıcıda Web Share ya da indirme + pano. */

import { Capacitor } from '@capacitor/core'

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

function dataUrlToBase64(dataUrl: string): string {
  const i = dataUrl.indexOf(',')
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], name, { type: 'image/png' })
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const ShareService = {
  async share(text: string, imageDataUrl?: string, fileName = 'demli-olsun.png'): Promise<ShareOutcome> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Share } = await import('@capacitor/share')
        let files: string[] | undefined
        if (imageDataUrl) {
          const { Filesystem, Directory } = await import('@capacitor/filesystem')
          const res = await Filesystem.writeFile({
            path: fileName,
            data: dataUrlToBase64(imageDataUrl),
            directory: Directory.Cache,
          })
          files = [res.uri]
        }
        await Share.share({ text, files, dialogTitle: 'Paylaş' })
        return 'shared'
      } catch (err) {
        const msg = String((err as Error)?.message ?? err)
        if (/cancel/i.test(msg)) return 'cancelled'
        return (await copyText(text)) ? 'copied' : 'failed'
      }
    }
    // Tarayıcı
    try {
      if (navigator.share) {
        const data: ShareData = { text }
        if (imageDataUrl) {
          const file = await dataUrlToFile(imageDataUrl, fileName)
          if (navigator.canShare?.({ files: [file] })) data.files = [file]
        }
        await navigator.share(data)
        return 'shared'
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled'
    }
    if (imageDataUrl) {
      const a = document.createElement('a')
      a.href = imageDataUrl
      a.download = fileName
      a.click()
    }
    return (await copyText(text)) ? 'copied' : 'failed'
  },
}
