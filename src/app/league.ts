/**
 * Haftalık lig akışı: geçmiş haftanın sonucu (yükselme/düşme/ödül) bir kez hesaplanır ve hemen uygulanır;
 * pencere yalnızca gösterir. Böylece uygulama kapansa bile ödül kaybolmaz.
 */

import { weekId } from '@/core/league'
import { tr } from '@/i18n/tr'
import { services } from '@/services'
import type { PlayerLeagueState, WeekResolution } from '@/services/leaderboard/LeaderboardService'
import { useEconomyStore } from '@/stores/economy'
import { useLeagueStore } from '@/stores/league'
import { saveNow } from '@/stores/persist'
import { usePlayerStore } from '@/stores/player'
import { useProgressStore } from '@/stores/progress'
import { useSessionStore } from '@/stores/session'
import { now } from './clock'

export function leagueState(): PlayerLeagueState {
  const league = useLeagueStore()
  return {
    name: usePlayerStore().nickname || tr.leaderboard.you,
    weekId: league.weekId,
    tier: league.tier,
    weeklyScore: league.weeklyScore,
    bestScore: useProgressStore().bestScore,
  }
}

let resolving: Promise<WeekResolution | null> | null = null

/** Kayıtlı hafta geçmişte kaldıysa sonucu uygular. Sonuç varsa session.leagueResult'a yazılır. */
export function resolveLeagueWeek(): Promise<WeekResolution | null> {
  resolving ??= (async () => {
    const league = useLeagueStore()
    const at = now()
    const current = weekId(at)
    if (league.weekId === current) return null
    if (league.weekId === null) {
      league.startWeek(current, league.tier)
      await saveNow()
      return null
    }
    let res: WeekResolution | null = null
    try {
      res = await services.leaderboard.resolvePastWeek(leagueState(), at)
    } catch (err) {
      console.warn('[lig] hafta sonucu hesaplanamadı', err)
    }
    league.startWeek(current, res?.newTier ?? league.tier)
    if (res) {
      if (res.reward > 0) useEconomyStore().add(res.reward)
      useSessionStore().leagueResult = res
    }
    await saveNow()
    return res
  })().finally(() => {
    resolving = null
  })
  return resolving
}
