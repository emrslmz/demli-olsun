/**
 * Android geri tuşu: en üstteki işleyici çalışır. Oyundayken duraklatır, alt ekrandayken bir geri gider,
 * ana menüdeyken çıkış onayı sorar. Tarayıcıda Escape tuşu aynı davranışı taklit eder.
 */

import { Capacitor } from '@capacitor/core'

type Handler = () => void

const stack: Handler[] = []
let initialized = false

export function pushBackHandler(fn: Handler): () => void {
  stack.push(fn)
  return () => {
    const i = stack.lastIndexOf(fn)
    if (i >= 0) stack.splice(i, 1)
  }
}

function handle(): void {
  const top = stack[stack.length - 1]
  top?.()
}

export async function initBackButton(): Promise<void> {
  if (initialized) return
  initialized = true
  if (Capacitor.getPlatform() === 'android') {
    const { App } = await import('@capacitor/app')
    await App.addListener('backButton', () => handle())
  } else if (!Capacitor.isNativePlatform()) {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handle()
    })
  }
}

export async function exitApp(): Promise<void> {
  if (Capacitor.getPlatform() === 'android') {
    const { App } = await import('@capacitor/app')
    await App.exitApp()
  }
}
