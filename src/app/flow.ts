/**
 * Oyun akışı (Vue tarafı): mesai/günlük/eğitim başlatma, duraklatma, devam, oyun sonu, ödüller ve kayıt.
 */

import { Capacitor } from '@capacitor/core'
import { bus, type ContinueOffer, type ShiftResult } from '@/bus'
import { CONTINUE_COST, type BoosterId } from '@/config/economy'
import { canShowInterstitial } from '@/core/adPolicy'
import { services } from '@/services'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { useAppStore } from '@/stores/app'
import { useEconomyStore } from '@/stores/economy'
import { useInventoryStore } from '@/stores/inventory'
import { useLeagueStore } from '@/stores/league'
import { saveNow } from '@/stores/persist'
import { usePlayerStore } from '@/stores/player'
import { useProgressStore } from '@/stores/progress'
import { useSessionStore } from '@/stores/session'

async function setStatusBar(visible: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    if (visible) await StatusBar.show()
    else await StatusBar.hide()
  } catch {
    /* yok say */
  }
}

/** Oyun ekranına girerken: banner kapanır, durum çubuğu gizlenir. */
function enterGame(): void {
  const app = useAppStore()
  app.open(null)
  app.go('game')
  void services.ads.hideBanner()
  void setStatusBar(false)
  AudioService.unlock()
}

export function leaveGameUi(): void {
  void setStatusBar(true)
}

export function startShift(boosters: BoosterId[]): void {
  const inv = useInventoryStore()
  const used: BoosterId[] = []
  for (const b of boosters) if (inv.useBooster(b)) used.push(b)
  useSessionStore().lastBoosters = used
  enterGame()
  bus.emit('game:start', { mode: 'shift', boosters: used })
}

export function pauseGame(): void {
  const app = useAppStore()
  if (app.screen !== 'game' || app.modal) return
  bus.emit('game:pause')
  app.open('pause')
}

export function resumeGame(): void {
  useAppStore().open(null)
  bus.emit('game:resume')
}

export function endShiftNow(): void {
  useAppStore().open(null)
  bus.emit('game:resume')
  bus.emit('game:end-request')
}

export function quitToMenu(): void {
  const app = useAppStore()
  app.open(null)
  bus.emit('game:quit')
  app.go('menu')
  leaveGameUi()
}

// ---------- Devam ----------

export function onContinueOffer(offer: ContinueOffer): void {
  const session = useSessionStore()
  session.continueOffer = { ...offer, adAvailable: services.ads.isRewardedReady() }
  useAppStore().open('continue')
}

export async function continueWithAd(): Promise<boolean> {
  const app = useAppStore()
  const outcome = await services.ads.showRewarded('continue')
  if (outcome === 'rewarded') {
    app.ads = { ...app.ads, lastRewardedAt: Date.now() }
    app.open(null)
    bus.emit('game:continue', { granted: true, viaAd: true })
    return true
  }
  if (outcome === 'unavailable' || outcome === 'failed') app.showToast('Reklam şu an yok. Biraz sonra tekrar dene.')
  return false
}

export function continueWithTips(): boolean {
  const econ = useEconomyStore()
  if (!econ.spend(CONTINUE_COST)) return false
  useAppStore().open(null)
  bus.emit('game:continue', { granted: true, viaAd: false })
  void saveNow()
  return true
}

export function declineContinue(): void {
  useAppStore().open(null)
  bus.emit('game:continue', { granted: false, viaAd: false })
}

// ---------- Oyun sonu ----------

export async function onGameOver(result: ShiftResult): Promise<void> {
  const app = useAppStore()
  const econ = useEconomyStore()
  const progress = useProgressStore()
  const league = useLeagueStore()
  const session = useSessionStore()
  const player = usePlayerStore()

  const prevTitle = progress.title.name
  const newRecord = result.score > progress.bestScore && result.score > 0
  econ.add(result.tipsEarned)
  progress.totalTipsEarned += result.tipsEarned
  progress.totalServed += result.served
  progress.shiftsPlayed += 1
  progress.bestCombo = Math.max(progress.bestCombo, result.bestCombo)
  if (newRecord) progress.bestScore = result.score

  // Haftalık lig: önceki ve sonraki sıra
  let rankBefore: number | null = null
  let rankAfter: number | null = null
  try {
    const now = new Date()
    const state = () => ({ name: player.nickname || 'Sen', weekId: league.weekId, tier: league.tier, weeklyScore: league.weeklyScore, bestScore: progress.bestScore })
    rankBefore = (await services.leaderboard.weekly(state(), now)).playerRank
    league.addShiftScore(result.score, now)
    rankAfter = (await services.leaderboard.weekly(state(), now)).playerRank
    league.lastRank = rankAfter
  } catch (err) {
    console.warn('[flow] lig hesaplanamadı', err)
  }

  // Reklam sayaçları
  app.ads = {
    ...app.ads,
    lifetimeShifts: app.ads.lifetimeShifts + 1,
    shiftsSinceInterstitial: app.ads.shiftsSinceInterstitial + 1,
  }

  const titleUp = progress.title.name !== prevTitle ? progress.title.name : null
  session.gameOver = { result, newRecord, tipsAwarded: result.tipsEarned, doubled: false, rankBefore, rankAfter, titleUp }
  if (newRecord) {
    AudioService.play('leagueUp')
    HapticsService.trigger('stars3')
  }
  await saveNow()
  app.open(null)
  app.go('gameover')
  leaveGameUi()
}

export async function doubleTips(): Promise<boolean> {
  const session = useSessionStore()
  const app = useAppStore()
  const info = session.gameOver
  if (!info || info.doubled || info.tipsAwarded <= 0) return false
  const outcome = await services.ads.showRewarded('doubleTips')
  if (outcome !== 'rewarded') {
    if (outcome === 'unavailable' || outcome === 'failed') app.showToast('Reklam şu an yok. Biraz sonra tekrar dene.')
    return false
  }
  useEconomyStore().add(info.tipsAwarded)
  useProgressStore().totalTipsEarned += info.tipsAwarded
  app.ads = { ...app.ads, lastRewardedAt: Date.now() }
  session.gameOver = { ...info, doubled: true }
  AudioService.play('purchase')
  void saveNow()
  return true
}

/** Oyun sonu → Tekrar/Menü geçişinde geçiş reklamı kuralları (Bölüm 11.2). */
export async function maybeInterstitial(): Promise<void> {
  const app = useAppStore()
  const decision = canShowInterstitial(
    {
      lifetimeShifts: app.ads.lifetimeShifts,
      shiftsSinceInterstitial: app.ads.shiftsSinceInterstitial,
      lastInterstitialAt: app.ads.lastInterstitialAt,
      lastRewardedAt: app.ads.lastRewardedAt,
      purchasedThisSession: app.purchasedThisSession,
      removeAds: app.noAds,
      adLoaded: services.ads.isInterstitialReady(),
    },
    Date.now(),
  )
  if (!decision.show) return
  const shown = await services.ads.showInterstitial()
  if (shown) {
    app.ads = { ...app.ads, lastInterstitialAt: Date.now(), shiftsSinceInterstitial: 0 }
    void saveNow()
  }
}

export async function playAgain(): Promise<void> {
  await maybeInterstitial()
  const session = useSessionStore()
  const inv = useInventoryStore()
  // Tekrar: aynı güçlendiriciler elde varsa yeniden kullanılır.
  const want = session.lastBoosters.filter((b) => (inv.boosters[b as BoosterId] ?? 0) > 0) as BoosterId[]
  startShift(want)
}

export async function gameOverToMenu(): Promise<void> {
  await maybeInterstitial()
  quitToMenu()
}
