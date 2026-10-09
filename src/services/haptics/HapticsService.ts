/** Titreşim (@capacitor/haptics). Ayarlardan kapatılabilir; her olay için zaman sınırı uygulanır. Web'de sessiz. */

import { Capacitor } from '@capacitor/core'

export type HapticEvent =
  | 'pourTick'
  | 'drop'
  | 'sugar'
  | 'serve'
  | 'stars3'
  | 'error'
  | 'lifeLost'
  | 'combo'
  | 'button'
  | 'purchase'

/** Olay başına en kısa aralık (ms). */
const THROTTLE: Record<HapticEvent, number> = {
  pourTick: 70,
  drop: 50,
  sugar: 80,
  serve: 150,
  stars3: 400,
  error: 400,
  lifeLost: 400,
  combo: 150,
  button: 60,
  purchase: 400,
}

type HapticsModule = typeof import('@capacitor/haptics')

class HapticsServiceImpl {
  enabled = true
  private readonly native = Capacitor.isNativePlatform()
  private mod: HapticsModule | null = null
  private loading: Promise<HapticsModule> | null = null
  private readonly last = new Map<HapticEvent, number>()

  private async m(): Promise<HapticsModule> {
    if (this.mod) return this.mod
    if (!this.loading) this.loading = import('@capacitor/haptics')
    this.mod = await this.loading
    return this.mod
  }

  /** Döküm sırasında: akış hızlandıkça 120 ms'den 70 ms'ye sıklaşan çok hafif darbe. */
  pourTick(flowRatio: number): void {
    const interval = 120 - 50 * Math.max(0, Math.min(1, flowRatio))
    this.fire('pourTick', interval)
  }

  trigger(e: HapticEvent): void {
    this.fire(e, THROTTLE[e])
  }

  private fire(e: HapticEvent, minInterval: number): void {
    if (!this.enabled || !this.native) return
    const now = performance.now()
    const prev = this.last.get(e) ?? -Infinity
    if (now - prev < minInterval) return
    this.last.set(e, now)
    void this.m().then(({ Haptics, ImpactStyle, NotificationType }) => {
      switch (e) {
        case 'pourTick':
        case 'drop':
          return Haptics.impact({ style: ImpactStyle.Light })
        case 'sugar':
          return Haptics.impact({ style: ImpactStyle.Light })
        case 'serve':
          return Haptics.impact({ style: ImpactStyle.Medium })
        case 'lifeLost':
          return Haptics.impact({ style: ImpactStyle.Heavy })
        case 'stars3':
        case 'purchase':
          return Haptics.notification({ type: NotificationType.Success })
        case 'error':
          return Haptics.notification({ type: NotificationType.Error })
        case 'combo':
        case 'button':
          return Haptics.selectionChanged()
      }
    })
  }
}

export const HapticsService = new HapticsServiceImpl()
