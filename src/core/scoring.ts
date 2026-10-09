/** Puanlama (Bölüm 5.5). Saf fonksiyonlar. */

import { SCORING, SUGAR, type GaugeMode } from '@/config/gameplay'
import { STAR_TIP_MULTIPLIER } from '@/config/economy'
import type { CustomerId } from '@/data/customers'

export type Stars = 0 | 1 | 2 | 3

export interface ServeInput {
  /** Gerçekleşen dem yüzdesi (0..100). */
  demPct: number
  /** Gerçekleşen doluluk yüzdesi (0..100+). */
  fillPct: number
  targetDem: number
  targetFill: number
  sugarGiven: number
  sugarTarget: number
  overflowed?: boolean
}

export interface ServeEvaluation {
  demErr: number
  fillErr: number
  demScore: number
  fillScore: number
  sugarPenalty: number
  /** 0..100 isabet. */
  accuracy: number
  stars: Stars
  /** false ise müşteri bardağı geri yollar ve can gider. */
  accepted: boolean
  overflowed: boolean
}

export function metricScore(err: number, k: number = SCORING.k): number {
  return Math.max(0, 100 - k * Math.abs(err))
}

export function starsFor(accuracy: number): Stars {
  if (accuracy >= SCORING.stars3) return 3
  if (accuracy >= SCORING.stars2) return 2
  if (accuracy >= SCORING.stars1) return 1
  return 0
}

export function evaluateServe(input: ServeInput): ServeEvaluation {
  const demErr = Math.abs(input.demPct - input.targetDem)
  const fillErr = Math.abs(input.fillPct - input.targetFill)
  const demScore = metricScore(demErr)
  const fillScore = metricScore(fillErr)
  const sugarPenalty = Math.abs(input.sugarGiven - input.sugarTarget) * SUGAR.penaltyPerCube
  const overflowed = !!input.overflowed
  let accuracy = Math.max(0, Math.min(100, (demScore + fillScore) / 2 - sugarPenalty))
  if (overflowed) accuracy = 0
  const accepted = !overflowed && accuracy >= SCORING.acceptMin
  return {
    demErr,
    fillErr,
    demScore,
    fillScore,
    sugarPenalty,
    accuracy,
    stars: accepted ? starsFor(accuracy) : 0,
    accepted,
    overflowed,
  }
}

/** Art arda ≥85 isabet serisini günceller; altında sıfırlanır. */
export function nextStreak(streak: number, accuracy: number): number {
  return accuracy >= SCORING.comboThreshold ? streak + 1 : 0
}

/** Kombo çarpanı: 1 + 0.1 × seri, en fazla 2.0. */
export function comboMultiplier(streak: number): number {
  if (streak <= 0) return 1
  return Math.min(SCORING.comboMax, 1 + SCORING.comboStep * streak)
}

export interface PointsInput {
  accuracy: number
  combo: number
  gauge: GaugeMode
  /** Kalan sabır oranı (0..1). */
  patienceRatio: number
  /** Yoğun saat puan çarpanı (normalde 1). */
  rushMultiplier?: number
  accepted: boolean
}

/** Puan = 100 × (isabet/100) × kombo × gösterge çarpanı + hız bonusu (yoğun saatte ×1.5). */
export function servePoints(p: PointsInput): number {
  if (!p.accepted) return 0
  const gaugeMult = SCORING.gaugeMultiplier[p.gauge]
  const base = SCORING.basePoints * (p.accuracy / 100) * p.combo * gaugeMult
  const speed = Math.max(0, Math.min(1, p.patienceRatio)) * SCORING.speedBonus
  return Math.round((base + speed) * (p.rushMultiplier ?? 1))
}

/** Müşteri bahşişi × yıldız çarpanı. Rıza Amca 3 yıldızın altında bahşiş vermez. */
export function tipFor(customer: CustomerId, baseTip: number, ev: ServeEvaluation): number {
  if (!ev.accepted) return Math.round(baseTip * STAR_TIP_MULTIPLIER.rejected)
  if (customer === 'riza' && ev.stars < 3) return 0
  return Math.round(baseTip * STAR_TIP_MULTIPLIER[ev.stars])
}

/** Yüzde puanı bir ondalıkla. */
export function round1(x: number): number {
  return Math.round(x * 10) / 10
}
