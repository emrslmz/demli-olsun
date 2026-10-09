/**
 * Çarşı işlemleri: kozmetik satın alma/kuşanma, güçlendirici satın alma, reklamla bedava güçlendirici,
 * Başlangıç Paketi teklifinin zamanlaması. Gerçek parayla satın alma flow.ts → buyProduct'tadır.
 */

import { bus } from '@/bus'
import { BOOSTERS, FREE_BOOSTER_ADS_PER_DAY, STARTER_OFFER, type BoosterId } from '@/config/economy'
import { istanbulDateKey } from '@/core/daily'
import { GLASS_SKINS, POT_SKINS, VENUES, type CosmeticKind } from '@/data/cosmetics'
import { services } from '@/services'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { useAppStore } from '@/stores/app'
import { useEconomyStore } from '@/stores/economy'
import { useInventoryStore } from '@/stores/inventory'
import { saveNow } from '@/stores/persist'
import { useProgressStore } from '@/stores/progress'
import { now } from './clock'

export type MarketTab = 'glasses' | 'pots' | 'venues' | 'boosters' | 'shop'

/** Kozmetiğin bahşiş fiyatı; satılmıyorsa ya da premium ise null. */
export function cosmeticPrice(kind: CosmeticKind, id: string): number | null {
  if (kind === 'glass') return GLASS_SKINS.find((g) => g.id === id)?.price ?? null
  if (kind === 'pot') return POT_SKINS.find((p) => p.id === id)?.price ?? null
  return VENUES.find((v) => v.id === id)?.price ?? null
}

/** Sahip mi? Premium mekanlar mağaza entitlement'ına bağlıdır. */
export function hasCosmetic(kind: CosmeticKind, id: string): boolean {
  if (kind === 'venue') {
    const v = VENUES.find((x) => x.id === id)
    if (v?.entitlement) return useAppStore().hasEntitlement(v.entitlement)
  }
  return useInventoryStore().isOwned(kind, id)
}

export function equipCosmetic(kind: CosmeticKind, id: string): boolean {
  const inv = useInventoryStore()
  if (!hasCosmetic(kind, id)) return false
  // Premium mekan envantere de işlenir (equip yalnızca sahip olunanı kabul eder).
  inv.own(kind, id)
  inv.equip(kind, id)
  bus.emit('cosmetic:equipped')
  HapticsService.trigger('button')
  void saveNow()
  return true
}

export function buyCosmetic(kind: CosmeticKind, id: string): boolean {
  const price = cosmeticPrice(kind, id)
  if (price === null || hasCosmetic(kind, id)) return false
  if (!useEconomyStore().spend(price)) return false
  useInventoryStore().own(kind, id)
  AudioService.play('purchase')
  HapticsService.trigger('purchase')
  equipCosmetic(kind, id)
  return true
}

export function buyBooster(id: BoosterId): boolean {
  if (!useEconomyStore().spend(BOOSTERS[id].price)) return false
  useInventoryStore().addBooster(id, 1)
  AudioService.play('purchase')
  HapticsService.trigger('purchase')
  void saveNow()
  return true
}

/** Bugün kalan reklamla bedava güçlendirici hakkı (İstanbul günü). */
export function freeBoostersLeft(): number {
  const app = useAppStore()
  const today = istanbulDateKey(now())
  const used = app.ads.freeBoosterDay === today ? app.ads.freeBoosterUsed : 0
  return Math.max(0, FREE_BOOSTER_ADS_PER_DAY - used)
}

export async function freeBoosterViaAd(id: BoosterId): Promise<boolean> {
  const app = useAppStore()
  if (freeBoostersLeft() <= 0) return false
  const outcome = await services.ads.showRewarded('freeBooster')
  if (outcome !== 'rewarded') {
    if (outcome === 'unavailable' || outcome === 'failed') app.showToast('Reklam şu an yok. Biraz sonra tekrar dene.')
    return false
  }
  const today = istanbulDateKey(now())
  const used = app.ads.freeBoosterDay === today ? app.ads.freeBoosterUsed : 0
  app.ads = { ...app.ads, freeBoosterDay: today, freeBoosterUsed: used + 1, lastRewardedAt: Date.now() }
  useInventoryStore().addBooster(id, 1)
  AudioService.play('purchase')
  void saveNow()
  return true
}

// ---------- Başlangıç Paketi ----------

/** Teklif bitiş anı (ms) ya da null (hiç gösterilmedi / alındı). */
export function starterOfferEndsAt(): number | null {
  const app = useAppStore()
  if (app.hasEntitlement('starter_pack') || app.flags.starterOfferAt === null) return null
  return app.flags.starterOfferAt + STARTER_OFFER.hours * 3600 * 1000
}

export function starterOfferActive(at = now().getTime()): boolean {
  const end = starterOfferEndsAt()
  return end !== null && at < end
}

/** 3. mesaiden sonra ilk kez menüye dönüşte teklifi başlatır. true: modal gösterilmeli. */
export function maybeStartStarterOffer(): boolean {
  const app = useAppStore()
  if (app.flags.starterOfferAt !== null || app.hasEntitlement('starter_pack')) return false
  if (useProgressStore().shiftsPlayed < STARTER_OFFER.afterShift) return false
  app.flags = { ...app.flags, starterOfferAt: now().getTime() }
  void saveNow()
  return true
}
