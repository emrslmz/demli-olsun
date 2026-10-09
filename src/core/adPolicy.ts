/** Geçiş reklamı sıklık kuralları (Bölüm 11.2). Saf fonksiyon, birim testli. */

import { INTERSTITIAL_RULES } from '@/config/ads'

export interface AdPolicyState {
  /** Ömür boyu tamamlanan mesai sayısı. */
  lifetimeShifts: number
  /** Son geçiş reklamından bu yana tamamlanan mesai sayısı (hiç gösterilmediyse lifetimeShifts). */
  shiftsSinceInterstitial: number
  /** Son geçiş reklamının zamanı (ms), hiç gösterilmediyse null. */
  lastInterstitialAt: number | null
  /** Son ödüllü reklamın zamanı (ms), hiç izlenmediyse null. */
  lastRewardedAt: number | null
  purchasedThisSession: boolean
  removeAds: boolean
  adLoaded: boolean
}

export type AdDenyReason =
  'removeAds' | 'purchasedThisSession' | 'tooFewShifts' | 'tooFewShiftsSinceLast' | 'tooSoonSinceLast' | 'recentRewarded' | 'notLoaded'

export interface AdDecision {
  show: boolean
  reason?: AdDenyReason
}

export function canShowInterstitial(s: AdPolicyState, now: number, rules: typeof INTERSTITIAL_RULES = INTERSTITIAL_RULES): AdDecision {
  if (s.removeAds) return { show: false, reason: 'removeAds' }
  if (s.purchasedThisSession) return { show: false, reason: 'purchasedThisSession' }
  if (s.lifetimeShifts < rules.minLifetimeShifts) return { show: false, reason: 'tooFewShifts' }
  if (s.lastInterstitialAt !== null) {
    if (s.shiftsSinceInterstitial < rules.minShiftsBetween) return { show: false, reason: 'tooFewShiftsSinceLast' }
    if (now - s.lastInterstitialAt < rules.minSecondsBetween * 1000) return { show: false, reason: 'tooSoonSinceLast' }
  }
  if (s.lastRewardedAt !== null && now - s.lastRewardedAt < rules.rewardedCooldownSec * 1000) {
    return { show: false, reason: 'recentRewarded' }
  }
  if (!s.adLoaded) return { show: false, reason: 'notLoaded' }
  return { show: true }
}
