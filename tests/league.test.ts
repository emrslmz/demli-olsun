import { describe, expect, it } from 'vitest'
import {
  botScoreAt,
  dailyBotAccuracies,
  dailyPercentile,
  gapToNext,
  generateBots,
  leagueReward,
  playerRank,
  resolveWeek,
  standings,
  weekId,
  weekProgress,
} from '@/core/league'

describe('league', () => {
  it('hafta kimliği İstanbul saatine göre pazartesi', () => {
    // 2026-10-12 pazartesi. Pazar 23:30 İstanbul = 20:30 UTC
    expect(weekId(new Date('2026-10-11T20:30:00Z'))).toBe('2026-10-05')
    // Pazartesi 00:00 İstanbul = Pazar 21:00 UTC
    expect(weekId(new Date('2026-10-11T21:00:00Z'))).toBe('2026-10-12')
    expect(weekId(new Date('2026-10-09T10:00:00Z'))).toBe('2026-10-05')
  })

  it('hafta ilerleyişi 0..1', () => {
    expect(weekProgress('2026-10-12', new Date('2026-10-11T21:00:00Z'))).toBe(0)
    expect(weekProgress('2026-10-12', new Date('2026-10-15T09:00:00Z'))).toBeCloseTo(0.5, 2)
    expect(weekProgress('2026-10-12', new Date('2026-10-30T00:00:00Z'))).toBe(1)
  })

  it('botlar deterministik', () => {
    expect(generateBots('2026-10-05', 'sehir')).toEqual(generateBots('2026-10-05', 'sehir'))
    expect(generateBots('2026-10-05', 'sehir')).not.toEqual(generateBots('2026-10-12', 'sehir'))
    expect(generateBots('2026-10-05', 'mahalle')).toHaveLength(29)
  })

  it('bot puanı zamanla monoton artar', () => {
    for (const b of generateBots('2026-10-05', 'ilce')) {
      let prev = 0
      for (let i = 0; i <= 50; i++) {
        const s = botScoreAt(b, i / 50)
        expect(s).toBeGreaterThanOrEqual(prev)
        prev = s
      }
    }
  })

  it('kademe yükseldikçe botlar güçlenir', () => {
    const avg = (t: 'mahalle' | 'turkiye') => generateBots('2026-10-05', t).reduce((s, b) => s + botScoreAt(b, 1), 0) / 29
    expect(avg('turkiye')).toBeGreaterThan(avg('mahalle') * 4)
  })

  it('sıralama, oyuncu sırası ve bir üst sıraya fark', () => {
    const bots = generateBots('2026-10-05', 'mahalle')
    const rows = standings(bots, 1, { name: 'Ben', score: 5000 })
    expect(rows).toHaveLength(30)
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1]!.score).toBeGreaterThanOrEqual(rows[i]!.score)
    const r = playerRank(rows)
    const gap = gapToNext(rows)
    if (r > 1) {
      expect(gap).toBe(rows[r - 2]!.score - 5000 + 1)
    } else {
      expect(gap).toBeNull()
    }
  })

  it('ilk 7 yükselir, son 5 düşer; uç kademelerde istisna', () => {
    expect(resolveWeek(1, 'mahalle').outcome).toBe('promoted')
    expect(resolveWeek(7, 'ilce').newTier).toBe('sehir')
    expect(resolveWeek(8, 'ilce').outcome).toBe('stayed')
    expect(resolveWeek(25, 'sehir').outcome).toBe('stayed')
    expect(resolveWeek(26, 'sehir').newTier).toBe('ilce')
    expect(resolveWeek(30, 'mahalle').outcome).toBe('stayed')
    expect(resolveWeek(1, 'turkiye').outcome).toBe('stayed')
  })

  it('lig ödülü sıra ve kademeyle artar', () => {
    expect(leagueReward(1, 'mahalle')).toBe(300)
    expect(leagueReward(1, 'turkiye')).toBe(1200)
    expect(leagueReward(5, 'mahalle')).toBe(120)
    expect(leagueReward(30, 'mahalle')).toBe(25)
  })

  it('günlük bot isabetleri: ortalama ~82, üst sınır 99.8', () => {
    const xs = dailyBotAccuracies('2026-10-09')
    expect(xs).toEqual(dailyBotAccuracies('2026-10-09'))
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length
    expect(mean).toBeGreaterThan(79)
    expect(mean).toBeLessThan(85)
    expect(Math.max(...xs)).toBeLessThanOrEqual(99.8)
    expect(dailyPercentile(100, xs)).toBe(100)
    expect(dailyPercentile(0, xs)).toBe(0)
  })
})
