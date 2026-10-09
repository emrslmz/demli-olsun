/**
 * Liderlik servisi arayüzü. İleride Game Center, Play Games ya da kendi backend'imiz
 * bu arayüzün arkasına takılabilir.
 */

import type { DailyRow, Standing, TierId, WeekOutcome } from '@/core/league'

export interface PlayerLeagueState {
  name: string
  weekId: string | null
  tier: TierId
  weeklyScore: number
  bestScore: number
}

export interface WeeklyBoard {
  weekId: string
  tier: TierId
  rows: Standing[]
  playerRank: number
  gapToNext: number | null
  msLeft: number
}

export interface WeekResolution {
  weekId: string
  tier: TierId
  rank: number
  outcome: WeekOutcome
  newTier: TierId
  reward: number
}

export interface AllTimeRow {
  name: string
  score: number
  isPlayer: boolean
  rank: number
}

export interface LeaderboardService {
  readonly mode: 'mock' | 'real'
  weekly(player: PlayerLeagueState, now: Date): Promise<WeeklyBoard>
  /** Kayıtlı hafta geçmişte kaldıysa o haftanın sonucunu hesaplar. */
  resolvePastWeek(player: PlayerLeagueState, now: Date): Promise<WeekResolution | null>
  daily(dateKey: string, player: { name: string; accuracy: number; timeSec: number } | null): Promise<DailyRow[]>
  dailyPercentile(dateKey: string, accuracy: number): Promise<number>
  allTime(player: PlayerLeagueState): Promise<AllTimeRow[]>
}
