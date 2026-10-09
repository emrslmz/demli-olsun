/**
 * Yaşam döngüsü: arka plana geçince oyun duraklar, kayıt yapılır, ses kesilir.
 * Dönüşte duraklatma ekranı görünür (Vue tarafı 'app:foreground' olayını dinler).
 */

import { Capacitor } from '@capacitor/core'
import { bus } from '@/bus'

let initialized = false

export async function initLifecycle(): Promise<void> {
  if (initialized) return
  initialized = true
  if (Capacitor.isNativePlatform()) {
    const { App } = await import('@capacitor/app')
    await App.addListener('appStateChange', ({ isActive }) => {
      bus.emit(isActive ? 'app:foreground' : 'app:background')
    })
  } else {
    document.addEventListener('visibilitychange', () => {
      bus.emit(document.visibilityState === 'visible' ? 'app:foreground' : 'app:background')
    })
  }
}
