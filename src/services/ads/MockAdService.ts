/**
 * Tarayıcı ve geliştirme için sahte reklam servisi. Geliştirici menüsünden senaryo seçilebilir:
 * başarı, iptal (kullanıcı ödülden önce kapatır), yüklenemedi.
 */

import type { RewardedPlacement } from '@/config/ads'
import { Listeners } from '../emitter'
import type { AdEvent, AdService, RewardOutcome } from './AdService'

export type MockAdScenario = 'success' | 'cancel' | 'fail'

export class MockAdService implements AdService {
  readonly kind = 'mock' as const
  scenario: MockAdScenario = 'success'
  private removed = false
  private bannerEl: HTMLDivElement | null = null
  private readonly listeners = new Listeners<AdEvent>()

  async init(): Promise<void> {
    this.emitAvailability()
  }

  async runConsentFlow(): Promise<void> {
    // Mock: onay gerekmez.
  }

  async privacyOptionsRequired(): Promise<boolean> {
    return true
  }

  async showPrivacyOptions(): Promise<void> {
    await this.overlay('Reklam tercihleri (test)', 'Gerçek cihazda burada Google onay formu açılır.', 0)
  }

  setScenario(s: MockAdScenario): void {
    this.scenario = s
    this.emitAvailability()
  }

  private online(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine !== false
  }

  isRewardedReady(): boolean {
    return this.scenario !== 'fail' && this.online()
  }

  isInterstitialReady(): boolean {
    return !this.removed && this.scenario !== 'fail' && this.online()
  }

  private emitAvailability(): void {
    this.listeners.emit({
      type: 'availability',
      rewarded: this.isRewardedReady(),
      interstitial: this.isInterstitialReady(),
    })
  }

  async showRewarded(placement: RewardedPlacement): Promise<RewardOutcome> {
    if (!this.isRewardedReady()) return 'unavailable'
    this.listeners.emit({ type: 'fullscreen', open: true })
    const watchedAll = await this.overlay(
      'Ödüllü reklam (test)',
      `Yerleşim: ${placement}. Ödül için reklamın bitmesini bekle.`,
      this.scenario === 'cancel' ? 0.8 : 2.2,
      this.scenario === 'cancel',
    )
    this.listeners.emit({ type: 'fullscreen', open: false })
    return watchedAll && this.scenario === 'success' ? 'rewarded' : 'dismissed'
  }

  async showInterstitial(): Promise<boolean> {
    if (!this.isInterstitialReady()) return false
    this.listeners.emit({ type: 'fullscreen', open: true })
    await this.overlay('Geçiş reklamı (test)', 'Bu bir test reklamıdır.', 1.2)
    this.listeners.emit({ type: 'fullscreen', open: false })
    return true
  }

  async showBanner(): Promise<void> {
    if (this.removed || typeof document === 'undefined' || this.bannerEl) return
    const el = document.createElement('div')
    el.className = 'mock-banner'
    el.textContent = 'Banner reklam (test)'
    document.body.appendChild(el)
    this.bannerEl = el
    this.listeners.emit({ type: 'banner', height: 50 })
  }

  async hideBanner(): Promise<void> {
    this.bannerEl?.remove()
    this.bannerEl = null
    this.listeners.emit({ type: 'banner', height: 0 })
  }

  setAdsRemoved(removed: boolean): void {
    this.removed = removed
    if (removed) void this.hideBanner()
    this.emitAvailability()
  }

  on(fn: (e: AdEvent) => void): () => void {
    return this.listeners.on(fn)
  }

  /** Tam ekran sahte reklam. `autoCloseEarly` iptal senaryosunu taklit eder. Döner: sonuna kadar izlendi mi. */
  private overlay(title: string, body: string, seconds: number, autoCloseEarly = false): Promise<boolean> {
    if (typeof document === 'undefined') return Promise.resolve(!autoCloseEarly)
    return new Promise((resolve) => {
      const el = document.createElement('div')
      el.className = 'mock-ad'
      el.innerHTML = `<div class="mock-ad__box"><b>${title}</b><p>${body}</p><span class="mock-ad__timer"></span><button type="button">Kapat</button></div>`
      document.body.appendChild(el)
      const timer = el.querySelector('.mock-ad__timer') as HTMLSpanElement
      const btn = el.querySelector('button') as HTMLButtonElement
      let left = seconds
      let done = seconds <= 0
      const finish = (watched: boolean) => {
        clearInterval(iv)
        el.remove()
        resolve(watched)
      }
      const tick = () => {
        if (left <= 0) {
          done = true
          timer.textContent = 'Ödül hazır.'
          if (autoCloseEarly) finish(false)
          return
        }
        timer.textContent = `${Math.ceil(left)} sn`
        left -= 0.1
        if (autoCloseEarly && left < seconds * 0.5) finish(false)
      }
      const iv = setInterval(tick, 100)
      tick()
      btn.addEventListener('click', () => finish(done))
    })
  }
}
