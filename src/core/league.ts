/**
 * Haftalık lig ve günlük tablo hesapları (Bölüm 12). Saf ve deterministik.
 * Botlar: seed = hafta kimliği + lig kademesi + botun sırası.
 */

import { LEAGUE_REWARDS } from '@/config/economy'
import { BOT_NAMES } from '@/data/botNames'
import { addDays, istanbulDateKey } from './daily'
import { tr } from '@/i18n/tr'
import { Rng } from './rng'

export type TierId = 'mahalle' | 'ilce' | 'sehir' | 'bolge' | 'turkiye'

export interface TierDef {
  id: TierId
  badge: string
  /** Bu kademedeki botların tam aktiflikteki medyan haftalık puanı. */
  botMedian: number
}

export const TIERS: TierDef[] = [
  { id: 'mahalle', badge: 'badge_mahalle', botMedian: 9000 },
  { id: 'ilce', badge: 'badge_ilce', botMedian: 20000 },
  { id: 'sehir', badge: 'badge_sehir', botMedian: 38000 },
  { id: 'bolge', badge: 'badge_bolge', botMedian: 65000 },
  { id: 'turkiye', badge: 'badge_turkiye', botMedian: 110000 },
]

export const GROUP_SIZE = 30
export const PROMOTE_COUNT = 7
export const DEMOTE_COUNT = 5

export function tierIndex(id: TierId): number {
  return TIERS.findIndex((t) => t.id === id)
}

/** Kademenin aktif dildeki adı. */
export function tierName(id: TierId): string {
  return tr.tiers[id]
}

export function tierDef(id: TierId): TierDef {
  return TIERS[Math.max(0, tierIndex(id))] as TierDef
}

/** Haftanın kimliği: o haftanın pazartesi gününün İstanbul tarihi ('YYYY-MM-DD'). */
export function weekId(date: Date): string {
  const key = istanbulDateKey(date)
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 pazar … 6 cumartesi
  const sinceMonday = (dow + 6) % 7
  return addDays(key, -sinceMonday)
}

/** Haftanın ne kadarı geçti (0..1). İstanbul UTC+3 sabit olduğundan ofset sabittir. */
export function weekProgress(week: string, now: Date): number {
  const [y, m, d] = week.split('-').map(Number) as [number, number, number]
  const start = Date.UTC(y, m - 1, d) - 3 * 3600 * 1000
  const p = (now.getTime() - start) / (7 * 86400000)
  return Math.max(0, Math.min(1, p))
}

/** Hafta bitimine kalan ms. */
export function msUntilWeekEnd(week: string, now: Date): number {
  const [y, m, d] = week.split('-').map(Number) as [number, number, number]
  const end = Date.UTC(y, m - 1, d) - 3 * 3600 * 1000 + 7 * 86400000
  return Math.max(0, end - now.getTime())
}

export interface BotSession {
  /** Haftanın hangi anında oynandı (0..1). */
  t: number
  points: number
}

export interface Bot {
  id: string
  name: string
  /** Tam aktiflikte haftalık toplam. */
  skill: number
  /** Haftalık aktiflik (0..1). */
  activity: number
  sessions: BotSession[]
}

export function generateBots(week: string, tier: TierId, count = GROUP_SIZE - 1): Bot[] {
  const names = new Rng(`league:names:${week}:${tier}`).shuffle([...BOT_NAMES])
  const median = tierDef(tier).botMedian
  const bots: Bot[] = []
  for (let i = 0; i < count; i++) {
    const rng = new Rng(`league:bot:${week}:${tier}:${i}`)
    const skill = median * Math.exp(rng.normal(0, 0.45))
    // Bazı botlar haftayı boş geçirir: alt sıralar her zaman ulaşılabilir kalsın.
    const activity = rng.chance(0.2) ? rng.float(0.05, 0.3) : rng.float(0.45, 1)
    const sessionCount = Math.max(1, Math.round(rng.float(3, 15) * activity))
    // Aktiflik eğrisi: kimi bot hafta başında, kimi sonunda yoğunlaşır.
    const bias = rng.float(0.55, 1.8)
    const total = skill * activity
    const sessions: BotSession[] = []
    let sum = 0
    const raw: number[] = []
    for (let s = 0; s < sessionCount; s++) {
      const w = rng.float(0.6, 1.4)
      raw.push(w)
      sum += w
    }
    for (let s = 0; s < sessionCount; s++) {
      sessions.push({
        t: rng.next() ** bias,
        points: Math.round((total * (raw[s] as number)) / sum),
      })
    }
    sessions.sort((a, b) => a.t - b.t)
    bots.push({ id: `bot_${i}`, name: names[i % names.length] as string, skill, activity, sessions })
  }
  return bots
}

export function botScoreAt(bot: Bot, progress: number): number {
  let s = 0
  for (const x of bot.sessions) {
    if (x.t <= progress) s += x.points
    else break
  }
  return s
}

export interface Standing {
  id: string
  name: string
  score: number
  isPlayer: boolean
  rank: number
}

export function standings(bots: Bot[], progress: number, player: { name: string; score: number }): Standing[] {
  const rows: Omit<Standing, 'rank'>[] = bots.map((b) => ({
    id: b.id,
    name: b.name,
    score: botScoreAt(b, progress),
    isPlayer: false,
  }))
  rows.push({ id: 'player', name: player.name, score: player.score, isPlayer: true })
  // Eşitlikte oyuncu öne geçer.
  rows.sort((a, b) => b.score - a.score || (a.isPlayer ? -1 : b.isPlayer ? 1 : a.id.localeCompare(b.id)))
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

export function playerRank(rows: Standing[]): number {
  return rows.find((r) => r.isPlayer)?.rank ?? rows.length
}

/** Bir üst sıraya ulaşmak için gereken puan; zaten birinciyse null. */
export function gapToNext(rows: Standing[]): number | null {
  const me = rows.findIndex((r) => r.isPlayer)
  if (me <= 0) return null
  const above = rows[me - 1] as Standing
  const mine = rows[me] as Standing
  return above.score - mine.score + 1
}

export type WeekOutcome = 'promoted' | 'demoted' | 'stayed'

export function resolveWeek(rank: number, tier: TierId, groupSize = GROUP_SIZE): { outcome: WeekOutcome; newTier: TierId } {
  const i = tierIndex(tier)
  if (rank <= PROMOTE_COUNT && i < TIERS.length - 1) {
    return { outcome: 'promoted', newTier: (TIERS[i + 1] as TierDef).id }
  }
  if (rank > groupSize - DEMOTE_COUNT && i > 0) {
    return { outcome: 'demoted', newTier: (TIERS[i - 1] as TierDef).id }
  }
  return { outcome: 'stayed', newTier: tier }
}

export function leagueReward(rank: number, tier: TierId): number {
  const mult = LEAGUE_REWARDS.tierMultiplier[tierIndex(tier)] ?? 1
  for (const [maxRank, tips] of LEAGUE_REWARDS.byRank) {
    if (rank <= maxRank) return Math.round(tips * mult)
  }
  return 0
}

/** Günün Siparişi bot isabetleri: ortalama 82, sapma 9, üst sınır 99.8. */
export function dailyBotAccuracies(dateKey: string, n = 500): number[] {
  const rng = new Rng(`daily:bots:${dateKey}`)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    out.push(Math.round(Math.max(0, Math.min(99.8, rng.normal(82, 9))) * 10) / 10)
  }
  return out.sort((a, b) => b - a)
}

/** Oyuncunun geçtiği bot yüzdesi (0..100, tam sayı). */
export function dailyPercentile(accuracy: number, bots: number[]): number {
  if (bots.length === 0) return 100
  let beaten = 0
  for (const b of bots) if (accuracy > b) beaten++
  return Math.round((beaten / bots.length) * 100)
}

export interface DailyRow {
  name: string
  accuracy: number
  timeSec: number
  isPlayer: boolean
  rank: number
}

/** Günlük tablo: isabete göre, eşitlikte süreye göre. Tüm satırlar döner; arayüz ilk sıraları ve oyuncunun çevresini gösterir. */
export function dailyTable(dateKey: string, player: { name: string; accuracy: number; timeSec: number } | null, n = 500): DailyRow[] {
  const rng = new Rng(`daily:table:${dateKey}`)
  const names = rng.shuffle([...BOT_NAMES])
  const accs = dailyBotAccuracies(dateKey, n)
  const rows: Omit<DailyRow, 'rank'>[] = accs.map((a, i) => ({
    name: `${names[i % names.length] as string}${i >= names.length ? Math.floor(i / names.length) + 1 : ''}`,
    accuracy: a,
    timeSec: Math.round(rng.float(6, 26) * 10) / 10,
    isPlayer: false,
  }))
  if (player) rows.push({ ...player, isPlayer: true })
  rows.sort((a, b) => b.accuracy - a.accuracy || a.timeSec - b.timeSec || (a.isPlayer ? -1 : b.isPlayer ? 1 : 0))
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}
