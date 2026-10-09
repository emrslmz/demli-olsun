/** Deterministik botlarla mock liderlik (Bölüm 12). Botlar gerçek oyuncu gibi sunulmaz. */

import {
  dailyBotAccuracies,
  dailyPercentile,
  dailyTable,
  gapToNext,
  generateBots,
  leagueReward,
  msUntilWeekEnd,
  playerRank,
  resolveWeek,
  standings,
  weekId,
  weekProgress,
  type DailyRow,
} from '@/core/league'
import { Rng } from '@/core/rng'
import { BOT_NAMES } from '@/data/botNames'
import type {
  AllTimeRow,
  LeaderboardService,
  PlayerLeagueState,
  WeekResolution,
  WeeklyBoard,
} from './LeaderboardService'

export class MockLeaderboardService implements LeaderboardService {
  readonly mode = 'mock' as const

  async weekly(player: PlayerLeagueState, now: Date): Promise<WeeklyBoard> {
    const week = weekId(now)
    const score = player.weekId === week ? player.weeklyScore : 0
    const bots = generateBots(week, player.tier)
    const rows = standings(bots, weekProgress(week, now), { name: player.name, score })
    return {
      weekId: week,
      tier: player.tier,
      rows,
      playerRank: playerRank(rows),
      gapToNext: gapToNext(rows),
      msLeft: msUntilWeekEnd(week, now),
    }
  }

  async resolvePastWeek(player: PlayerLeagueState, now: Date): Promise<WeekResolution | null> {
    const current = weekId(now)
    if (!player.weekId || player.weekId === current) return null
    const bots = generateBots(player.weekId, player.tier)
    const rows = standings(bots, 1, { name: player.name, score: player.weeklyScore })
    const rank = playerRank(rows)
    // Hiç oynamadığı haftada ödül ve yükselme yok; düşme kuralı yine uygulanır.
    const res = resolveWeek(rank, player.tier)
    const reward = player.weeklyScore > 0 ? leagueReward(rank, player.tier) : 0
    return { weekId: player.weekId, tier: player.tier, rank, ...res, reward }
  }

  async daily(dateKey: string, player: { name: string; accuracy: number; timeSec: number } | null): Promise<DailyRow[]> {
    return dailyTable(dateKey, player)
  }

  async dailyPercentile(dateKey: string, accuracy: number): Promise<number> {
    return dailyPercentile(accuracy, dailyBotAccuracies(dateKey))
  }

  async allTime(player: PlayerLeagueState): Promise<AllTimeRow[]> {
    const rng = new Rng('alltime:v1')
    const names = rng.shuffle([...BOT_NAMES])
    const rows: Omit<AllTimeRow, 'rank'>[] = []
    for (let i = 0; i < 49; i++) {
      rows.push({
        name: names[i % names.length] as string,
        score: Math.round(2500 * Math.exp(rng.normal(0.9, 0.55))),
        isPlayer: false,
      })
    }
    rows.push({ name: player.name, score: player.bestScore, isPlayer: true })
    rows.sort((a, b) => b.score - a.score || (a.isPlayer ? -1 : 1))
    return rows.map((r, i) => ({ ...r, rank: i + 1 }))
  }
}
