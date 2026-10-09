/** Reklam servisi arayüzü. Tarayıcıda mock, cihazda AdMob kullanılır. */

import type { RewardedPlacement } from '@/config/ads'

export type RewardOutcome = 'rewarded' | 'dismissed' | 'failed' | 'unavailable'

export type AdEvent =
  | { type: 'fullscreen'; open: boolean }
  | { type: 'availability'; rewarded: boolean; interstitial: boolean }
  | { type: 'banner'; height: number }

export interface AdService {
  readonly kind: 'admob' | 'mock'
  init(): Promise<void>
  /** Google UMP onay akışı (gerekiyorsa) → iOS ATT → AdMob initialize. */
  runConsentFlow(): Promise<void>
  /** Ayarlar'daki "Reklam tercihleri" (UMP privacy options formu) gerekli mi. */
  privacyOptionsRequired(): Promise<boolean>
  showPrivacyOptions(): Promise<void>
  isRewardedReady(): boolean
  isInterstitialReady(): boolean
  /** Ödüllü reklam: ödül yalnızca 'rewarded' dönerse verilir. */
  showRewarded(placement: RewardedPlacement): Promise<RewardOutcome>
  /** Geçiş reklamı. Yüklü değilse sessizce false döner, kullanıcıyı bekletmez. */
  showInterstitial(): Promise<boolean>
  showBanner(): Promise<void>
  hideBanner(): Promise<void>
  /** remove_ads alındığında banner ve geçiş reklamlarını tamamen kapatır. */
  setAdsRemoved(removed: boolean): void
  on(fn: (e: AdEvent) => void): () => void
}
