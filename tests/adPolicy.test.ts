import { describe, expect, it } from 'vitest'
import { canShowInterstitial, type AdPolicyState } from '@/core/adPolicy'

const NOW = 1_800_000_000_000
const ok: AdPolicyState = {
  lifetimeShifts: 5,
  shiftsSinceInterstitial: 2,
  lastInterstitialAt: NOW - 121_000,
  lastRewardedAt: null,
  purchasedThisSession: false,
  removeAds: false,
  adLoaded: true,
}

describe('adPolicy', () => {
  it('tüm koşullar sağlanınca gösterilir', () => {
    expect(canShowInterstitial(ok, NOW).show).toBe(true)
  })

  it('ömür boyu 3 mesaiden önce gösterilmez', () => {
    expect(canShowInterstitial({ ...ok, lifetimeShifts: 2, lastInterstitialAt: null }, NOW).reason).toBe('tooFewShifts')
    expect(canShowInterstitial({ ...ok, lifetimeShifts: 3, lastInterstitialAt: null }, NOW).show).toBe(true)
  })

  it('son reklamdan bu yana 2 mesai VE 120 sn gerekir', () => {
    expect(canShowInterstitial({ ...ok, shiftsSinceInterstitial: 1 }, NOW).reason).toBe('tooFewShiftsSinceLast')
    expect(canShowInterstitial({ ...ok, lastInterstitialAt: NOW - 119_000 }, NOW).reason).toBe('tooSoonSinceLast')
  })

  it('son 60 sn içinde ödüllü reklam izlendiyse gösterilmez', () => {
    expect(canShowInterstitial({ ...ok, lastRewardedAt: NOW - 30_000 }, NOW).reason).toBe('recentRewarded')
    expect(canShowInterstitial({ ...ok, lastRewardedAt: NOW - 61_000 }, NOW).show).toBe(true)
  })

  it('satın alma ve remove_ads engeller', () => {
    expect(canShowInterstitial({ ...ok, purchasedThisSession: true }, NOW).show).toBe(false)
    expect(canShowInterstitial({ ...ok, removeAds: true }, NOW).reason).toBe('removeAds')
  })

  it('reklam yüklü değilse sessizce atlanır', () => {
    expect(canShowInterstitial({ ...ok, adLoaded: false }, NOW).reason).toBe('notLoaded')
  })
})
