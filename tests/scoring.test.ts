import { describe, expect, it } from 'vitest'
import { comboMultiplier, evaluateServe, metricScore, nextStreak, servePoints, starsFor, tipFor } from '@/core/scoring'

const base = { demPct: 35, fillPct: 85, targetDem: 35, targetFill: 85, sugarGiven: 0, sugarTarget: 0 }

describe('scoring', () => {
  it('metrik puanı: max(0, 100 − 4 × hata)', () => {
    expect(metricScore(0)).toBe(100)
    expect(metricScore(5)).toBe(80)
    expect(metricScore(-5)).toBe(80)
    expect(metricScore(25)).toBe(0)
    expect(metricScore(40)).toBe(0)
  })

  it('kusursuz servis 100 isabet ve 3 yıldız', () => {
    const e = evaluateServe(base)
    expect(e.accuracy).toBe(100)
    expect(e.stars).toBe(3)
    expect(e.accepted).toBe(true)
  })

  it('yıldız sınırları', () => {
    expect(starsFor(95)).toBe(3)
    expect(starsFor(94.99)).toBe(2)
    expect(starsFor(85)).toBe(2)
    expect(starsFor(84.9)).toBe(1)
    expect(starsFor(70)).toBe(1)
    expect(starsFor(69.9)).toBe(0)
  })

  it('50–69 kabul edilir ama 0 yıldız, <50 reddedilir', () => {
    const ok = evaluateServe({ ...base, demPct: 35 + 10, fillPct: 85 + 5 }) // 60 ve 80 → 70
    expect(ok.accuracy).toBe(70)
    const zero = evaluateServe({ ...base, demPct: 35 + 10, fillPct: 85 + 10 }) // 60, 60 → 60
    expect(zero.accuracy).toBe(60)
    expect(zero.stars).toBe(0)
    expect(zero.accepted).toBe(true)
    const edge = evaluateServe({ ...base, demPct: 35 + 12.5, fillPct: 85 + 12.5 }) // 50
    expect(edge.accuracy).toBe(50)
    expect(edge.accepted).toBe(true)
    const rej = evaluateServe({ ...base, demPct: 35 + 13, fillPct: 85 + 13 })
    expect(rej.accepted).toBe(false)
    expect(rej.stars).toBe(0)
  })

  it('şeker cezası her yanlış küp için 15', () => {
    expect(evaluateServe({ ...base, sugarTarget: 2, sugarGiven: 1 }).accuracy).toBe(85)
    expect(evaluateServe({ ...base, sugarTarget: 0, sugarGiven: 2 }).accuracy).toBe(70)
    expect(evaluateServe({ ...base, sugarTarget: 3, sugarGiven: 3 }).accuracy).toBe(100)
  })

  it('isabet 0 altına inmez', () => {
    expect(evaluateServe({ ...base, demPct: 90, fillPct: 10, sugarTarget: 3 }).accuracy).toBe(0)
  })

  it('taşma reddedilir', () => {
    const e = evaluateServe({ ...base, overflowed: true })
    expect(e.accepted).toBe(false)
    expect(e.accuracy).toBe(0)
  })

  it('kombo: 1 + 0.1 × seri, en fazla 2.0; 85 altında sıfırlanır', () => {
    expect(comboMultiplier(0)).toBe(1)
    expect(comboMultiplier(1)).toBeCloseTo(1.1)
    expect(comboMultiplier(3)).toBeCloseTo(1.3)
    expect(comboMultiplier(10)).toBe(2)
    expect(comboMultiplier(25)).toBe(2)
    expect(nextStreak(4, 85)).toBe(5)
    expect(nextStreak(4, 84.9)).toBe(0)
  })

  it('puan formülü', () => {
    // 100 × 1 × 1 × 1 + 0.5 × 30 = 115
    expect(servePoints({ accuracy: 100, combo: 1, gauge: 'numbers', patienceRatio: 0.5, accepted: true })).toBe(115)
    // 100 × 0.9 × 1.2 × 1.5 + 0 = 162
    expect(servePoints({ accuracy: 90, combo: 1.2, gauge: 'none', patienceRatio: 0, accepted: true })).toBe(162)
    // Yoğun saat ×1.5
    expect(servePoints({ accuracy: 100, combo: 1, gauge: 'marks', patienceRatio: 1, accepted: true, rushMultiplier: 1.5 })).toBe(
      Math.round((120 + 30) * 1.5),
    )
    expect(servePoints({ accuracy: 40, combo: 2, gauge: 'none', patienceRatio: 1, accepted: false })).toBe(0)
  })

  it('bahşiş yıldız çarpanıyla; Rıza Amca 3 yıldız altında vermez', () => {
    const three = evaluateServe(base)
    const two = evaluateServe({ ...base, demPct: 41 }) // (76 + 100) / 2 = 88
    expect(tipFor('muhtar', 12, three)).toBe(18)
    expect(tipFor('muhtar', 12, two)).toBe(15)
    expect(tipFor('riza', 6, three)).toBe(9)
    expect(tipFor('riza', 6, two)).toBe(0)
    expect(tipFor('taksici', 10, evaluateServe({ ...base, overflowed: true }))).toBe(0)
  })
})
