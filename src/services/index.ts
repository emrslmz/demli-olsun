/**
 * Servislerin seçimi: tarayıcıda mock'lar, cihazda gerçek uygulamalar (Capacitor.isNativePlatform()).
 * `.env` üzerinden mock zorla seçilebilir.
 */

import { Capacitor } from '@capacitor/core'
import { FORCE_MOCK_ADS } from '@/config/ads'
import { FORCE_MOCK_IAP } from '@/config/products'
import type { AdService } from './ads/AdService'
import { MockAdService } from './ads/MockAdService'
import type { PurchaseService } from './iap/PurchaseService'
import { MockPurchaseService } from './iap/MockPurchaseService'
import type { LeaderboardService } from './leaderboard/LeaderboardService'
import { MockLeaderboardService } from './leaderboard/MockLeaderboardService'
import { PreferencesStore, SaveService } from './save/SaveService'

const native = Capacitor.isNativePlatform()

let ads: AdService = new MockAdService()
let purchases: PurchaseService = new MockPurchaseService()
const leaderboard: LeaderboardService = new MockLeaderboardService()
const save = new SaveService(new PreferencesStore())

/** Gerçek servisler dinamik import ile yüklenir; web paketine native SDK kodu girmez. */
export async function initServiceImplementations(): Promise<void> {
  if (native && !FORCE_MOCK_ADS) {
    const { AdMobAdService } = await import('./ads/AdMobAdService')
    ads = new AdMobAdService()
  }
  if (native && !FORCE_MOCK_IAP) {
    const { RevenueCatPurchaseService } = await import('./iap/RevenueCatPurchaseService')
    purchases = new RevenueCatPurchaseService()
  }
}

export const services = {
  get ads(): AdService {
    return ads
  },
  get purchases(): PurchaseService {
    return purchases
  },
  get leaderboard(): LeaderboardService {
    return leaderboard
  },
  get save(): SaveService {
    return save
  },
}

export const LEADERBOARD_MODE: 'mock' | 'real' = import.meta.env.VITE_LEADERBOARD_MODE === 'real' ? 'real' : 'mock'
