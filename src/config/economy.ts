/** Ekonomi ayarları: bahşiş, fiyatlar, ödüller. */

export const STARTING_TIPS = 100

/** Müşteri bahşişinin yıldıza göre çarpanı. Reddedilen sipariş 0. */
export const STAR_TIP_MULTIPLIER = {
  rejected: 0,
  0: 0.5,
  1: 1,
  2: 1.25,
  3: 1.5,
} as const

/** Günün Siparişi bahşişi: kabul edilirse taban + yıldız başına; reddedilirse teselli. */
export const DAILY_REWARD = { base: 20, perStar: 15, rejected: 5 }

/** 7 gün boyunca artan günlük giriş ödülü. Bir gün kaçarsa başa döner. */
export const DAILY_LOGIN_REWARDS = [20, 30, 40, 60, 80, 100, 150]

export type BoosterId = 'ustaGozu' | 'sabirTasi' | 'yedekBardak'

export const BOOSTERS: Record<BoosterId, { price: number; patienceBonus?: number; durationSec?: number }> = {
  /** Bu mesaide göstergeler rakamlı kalır, gösterge çarpanı 1.0 olur. */
  ustaGozu: { price: 150 },
  /** İlk 60 sn boyunca sabır %50 artar. */
  sabirTasi: { price: 120, patienceBonus: 0.5, durationSec: 60 },
  /** Mesaiye +1 canla başlanır. */
  yedekBardak: { price: 200 },
}

/** Günde ödüllü reklamla bedava alınabilecek güçlendirici sayısı. */
export const FREE_BOOSTER_ADS_PER_DAY = 3

/** Bahşişle devam etmenin bedeli. */
export const CONTINUE_COST = 150

/** Premium olmayan ikinci mekanın bahşiş fiyatı. */
export const VENUE_SAHIL_PRICE = 2500

export const TITLES = [
  { id: 'cirak', name: 'Çırak', minServed: 0 },
  { id: 'kalfa', name: 'Kalfa', minServed: 50 },
  { id: 'usta', name: 'Usta', minServed: 200 },
  { id: 'caybasi', name: 'Çaybaşı', minServed: 500 },
  { id: 'ocakAgasi', name: 'Ocak Ağası', minServed: 1500 },
] as const

/** Haftalık lig sonunda sıraya göre ödül (kademe çarpanıyla). */
export const LEAGUE_REWARDS = {
  /** [sıra üst sınırı, bahşiş] — ilk eşleşen kullanılır. */
  byRank: [
    [1, 300],
    [3, 200],
    [7, 120],
    [15, 60],
    [30, 25],
  ] as [number, number][],
  tierMultiplier: [1, 1.5, 2, 3, 4],
}

/** Günün Siparişi gün numarası bu tarihten (Europe/Istanbul) sayılır: bu gün #1. */
export const LAUNCH_DATE = '2026-10-01'

/** Başlangıç paketi teklifi kaçıncı mesai bittiğinde çıkar ve kaç saat Kese'de kalır. */
export const STARTER_OFFER = {
  afterShift: 3,
  hours: 48,
  tips: 1500,
  boostersEach: 3,
  glassId: 'baslangic',
}
