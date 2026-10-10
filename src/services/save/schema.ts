/** Kayıt şeması. Şema değiştiğinde SAVE_VERSION artırılır ve migrations.ts'e bir adım eklenir. */

import type { BoosterId } from '@/config/economy'
import type { EntitlementId } from '@/config/products'
import type { ThemeSetting } from '@/config/theme'
import type { TierId } from '@/core/league'

export const SAVE_VERSION = 1

export interface DailyHistoryEntry {
  day: string
  accuracy: number
  timeSec: number
}

export interface SettingsData {
  music: boolean
  musicVolume: number
  sfx: boolean
  sfxVolume: number
  haptics: boolean
  reducedMotion: boolean
  colorBlind: boolean
  notifications: boolean
  /** Günün siparişi bildirim saati (0..23). */
  notifyHour: number
  theme: ThemeSetting
  /** Düşük kalite (otomatik FPS düşüşü sonrası). */
  lowQuality: boolean
  /** Arayüz dili; 'auto' cihaz diline göre (Türkçe değilse İngilizce). */
  language: 'auto' | 'tr' | 'en'
}

export interface SaveData {
  version: number
  player: { id: string; nickname: string; createdAt: number }
  tips: number
  inventory: {
    /** Sahip olunan kozmetikler: 'glass:klasik', 'pot:celik', 'venue:mahalle' … */
    owned: string[]
    equipped: { glass: string; pot: string; venue: string }
    boosters: Record<BoosterId, number>
  }
  progress: {
    totalServed: number
    bestScore: number
    shiftsPlayed: number
    totalTipsEarned: number
    bestCombo: number
  }
  daily: {
    lastPlayedDay: string | null
    streak: number
    bestStreak: number
    history: DailyHistoryEntry[]
    /** Günlük giriş ödülü. */
    loginLastDay: string | null
    loginIndex: number
  }
  league: {
    weekId: string | null
    tier: TierId
    weeklyScore: number
    /** Son mesai bitmeden önceki sıra (oyun sonunda "12. → 7." için). */
    lastRank: number | null
  }
  ads: {
    lifetimeShifts: number
    shiftsSinceInterstitial: number
    lastInterstitialAt: number | null
    lastRewardedAt: number | null
    freeBoosterDay: string | null
    freeBoosterUsed: number
  }
  settings: SettingsData
  flags: {
    onboardingDone: boolean
    tutorialDone: boolean
    consentDone: boolean
    /** Başlangıç paketi teklifinin ilk gösterildiği an (ms). */
    starterOfferAt: number | null
    /** İlk günlük siparişten sonra bildirim izni soruldu mu. */
    notifAsked: boolean
  }
  purchases: {
    processedTransactions: string[]
    /** Mağazadan gelen entitlement'ların yerel önbelleği. */
    entitlements: EntitlementId[]
  }
}

export function randomId(): string {
  const a = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a)
  else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function suggestNickname(rand: () => number = Math.random): string {
  const digits = rand() < 0.5 ? 2 : 3
  const n = Math.floor(rand() * 10 ** digits)
  return `Çaycı${String(n).padStart(digits, '0')}`
}

export function defaultSave(now: number = Date.now()): SaveData {
  return {
    version: SAVE_VERSION,
    player: { id: randomId(), nickname: '', createdAt: now },
    tips: 100,
    inventory: {
      owned: ['glass:klasik', 'pot:celik', 'venue:mahalle'],
      equipped: { glass: 'klasik', pot: 'celik', venue: 'mahalle' },
      boosters: { ustaGozu: 0, sabirTasi: 0, yedekBardak: 0 },
    },
    progress: { totalServed: 0, bestScore: 0, shiftsPlayed: 0, totalTipsEarned: 0, bestCombo: 0 },
    daily: { lastPlayedDay: null, streak: 0, bestStreak: 0, history: [], loginLastDay: null, loginIndex: 0 },
    league: { weekId: null, tier: 'mahalle', weeklyScore: 0, lastRank: null },
    ads: {
      lifetimeShifts: 0,
      shiftsSinceInterstitial: 0,
      lastInterstitialAt: null,
      lastRewardedAt: null,
      freeBoosterDay: null,
      freeBoosterUsed: 0,
    },
    settings: {
      music: true,
      musicVolume: 0.6,
      sfx: true,
      sfxVolume: 0.8,
      haptics: true,
      reducedMotion: false,
      colorBlind: false,
      notifications: false,
      notifyHour: 10,
      theme: 'auto',
      lowQuality: false,
      language: 'auto',
    },
    flags: { onboardingDone: false, tutorialDone: false, consentDone: false, starterOfferAt: null, notifAsked: false },
    purchases: { processedTransactions: [], entitlements: [] },
  }
}
