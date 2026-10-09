/**
 * Store'lar ↔ kayıt dosyası. Kayıt; mesai sonunda, satın almada, ayar değişiminde ve arka plana geçişte yapılır.
 */

import { services } from '@/services'
import { SAVE_VERSION, type SaveData } from '@/services/save/schema'
import { useAppStore } from './app'
import { useDailyStore } from './daily'
import { useEconomyStore } from './economy'
import { useInventoryStore } from './inventory'
import { useLeagueStore } from './league'
import { usePlayerStore } from './player'
import { useProgressStore } from './progress'
import { useSettingsStore } from './settings'

export function hydrateStores(d: SaveData): void {
  const player = usePlayerStore()
  player.id = d.player.id
  player.nickname = d.player.nickname
  player.createdAt = d.player.createdAt

  useEconomyStore().tips = d.tips

  const inv = useInventoryStore()
  inv.owned = [...d.inventory.owned]
  inv.equipped = { ...d.inventory.equipped }
  inv.boosters = { ...d.inventory.boosters }

  const p = useProgressStore()
  p.totalServed = d.progress.totalServed
  p.bestScore = d.progress.bestScore
  p.shiftsPlayed = d.progress.shiftsPlayed
  p.totalTipsEarned = d.progress.totalTipsEarned
  p.bestCombo = d.progress.bestCombo

  const daily = useDailyStore()
  daily.lastPlayedDay = d.daily.lastPlayedDay
  daily.streak = d.daily.streak
  daily.bestStreak = d.daily.bestStreak
  daily.history = [...d.daily.history]
  daily.loginLastDay = d.daily.loginLastDay
  daily.loginIndex = d.daily.loginIndex

  const league = useLeagueStore()
  league.weekId = d.league.weekId
  league.tier = d.league.tier
  league.weeklyScore = d.league.weeklyScore
  league.lastRank = d.league.lastRank

  const settings = useSettingsStore()
  settings.data = { ...d.settings }

  const app = useAppStore()
  app.flags = { ...d.flags }
  app.ads = { ...d.ads }
  app.processedTransactions = [...d.purchases.processedTransactions]
  app.entitlements = [...d.purchases.entitlements]
}

export function collectSave(): SaveData {
  const player = usePlayerStore()
  const inv = useInventoryStore()
  const p = useProgressStore()
  const daily = useDailyStore()
  const league = useLeagueStore()
  const app = useAppStore()
  return {
    version: SAVE_VERSION,
    player: { id: player.id, nickname: player.nickname, createdAt: player.createdAt },
    tips: useEconomyStore().tips,
    inventory: { owned: [...inv.owned], equipped: { ...inv.equipped }, boosters: { ...inv.boosters } },
    progress: {
      totalServed: p.totalServed,
      bestScore: p.bestScore,
      shiftsPlayed: p.shiftsPlayed,
      totalTipsEarned: p.totalTipsEarned,
      bestCombo: p.bestCombo,
    },
    daily: {
      lastPlayedDay: daily.lastPlayedDay,
      streak: daily.streak,
      bestStreak: daily.bestStreak,
      history: [...daily.history],
      loginLastDay: daily.loginLastDay,
      loginIndex: daily.loginIndex,
    },
    league: {
      weekId: league.weekId,
      tier: league.tier,
      weeklyScore: league.weeklyScore,
      lastRank: league.lastRank,
    },
    ads: { ...app.ads },
    settings: { ...useSettingsStore().data },
    flags: { ...app.flags },
    purchases: {
      processedTransactions: app.processedTransactions.slice(-200),
      entitlements: [...app.entitlements],
    },
  }
}

export function saveNow(): Promise<void> {
  return services.save.save(collectSave())
}
