import { describe, expect, it } from 'vitest'
import {
  addDays,
  buildShareText,
  dailyChallenge,
  dayNumber,
  istanbulDateKey,
  metricSquares,
  msUntilNextIstanbulMidnight,
  nextDailyStreak,
} from '@/core/daily'

describe('daily', () => {
  it('aynı tarih aynı siparişi, farklı tarih farklı siparişi üretir', () => {
    expect(dailyChallenge('2026-10-09')).toEqual(dailyChallenge('2026-10-09'))
    const days = Array.from({ length: 10 }, (_, i) => JSON.stringify(dailyChallenge(addDays('2026-10-01', i)).order))
    expect(new Set(days).size).toBeGreaterThan(8)
  })

  it('gün sınırı İstanbul saatinde (UTC+3)', () => {
    // 20:59 UTC = 23:59 İstanbul → hâlâ 9 Ekim
    expect(istanbulDateKey(new Date('2026-10-09T20:59:00Z'))).toBe('2026-10-09')
    // 21:00 UTC = 00:00 İstanbul → 10 Ekim
    expect(istanbulDateKey(new Date('2026-10-09T21:00:00Z'))).toBe('2026-10-10')
    expect(dailyChallenge(istanbulDateKey(new Date('2026-10-09T21:00:00Z')))).toEqual(dailyChallenge('2026-10-10'))
  })

  it('gece yarısına kalan süre', () => {
    expect(msUntilNextIstanbulMidnight(new Date('2026-10-09T20:00:00Z'))).toBe(3600 * 1000)
    expect(msUntilNextIstanbulMidnight(new Date('2026-10-09T21:00:00Z'))).toBe(24 * 3600 * 1000)
  })

  it('gün numarası çıkış tarihinden', () => {
    expect(dayNumber('2026-10-01')).toBe(1)
    expect(dayNumber('2026-10-09')).toBe(9)
    expect(dayNumber('2027-02-18')).toBe(141)
    expect(dayNumber('2026-09-01')).toBe(1)
  })

  it('seri: dün oynandıysa artar, kaçırılırsa 1', () => {
    expect(nextDailyStreak(null, 0, '2026-10-09')).toBe(1)
    expect(nextDailyStreak('2026-10-08', 4, '2026-10-09')).toBe(5)
    expect(nextDailyStreak('2026-10-09', 5, '2026-10-09')).toBe(5)
    expect(nextDailyStreak('2026-10-06', 9, '2026-10-09')).toBe(1)
    expect(nextDailyStreak('2026-12-31', 3, '2027-01-01')).toBe(4)
  })

  it('kareler: her kare 20 puan', () => {
    expect(metricSquares(100)).toBe('🟩🟩🟩🟩🟩')
    expect(metricSquares(90)).toBe('🟩🟩🟩🟩🟨')
    expect(metricSquares(40)).toBe('🟩🟩⬛⬛⬛')
    expect(metricSquares(0)).toBe('⬛⬛⬛⬛⬛')
  })

  it('paylaşım metni biçimi', () => {
    const t = buildShareText({
      dayNumber: 142,
      customerName: 'Muhtar',
      line: 'Ohh, eline sağlık evladım.',
      demScore: 92,
      fillScore: 100,
      streak: 12,
      storeUrl: 'https://example.com',
    })
    expect(t).toBe(
      [
        'Demli Olsun #142 🫖',
        'Müşteri: Muhtar',
        '"Ohh, eline sağlık evladım."',
        'Renk    🟩🟩🟩🟩🟨',
        'Doluluk 🟩🟩🟩🟩🟩',
        'Seri 🔥12',
        'https://example.com',
      ].join('\n'),
    )
  })

  it('günlük siparişte esnaf ve porselen yok, akış çarpanı sınırlı', () => {
    for (let i = 0; i < 60; i++) {
      const c = dailyChallenge(addDays('2026-10-01', i))
      expect(c.order.customer).not.toBe('esnaf')
      expect(['ince', 'duz', 'kupa']).toContain(c.order.glass)
      expect(c.flowScale.dem).toBeGreaterThanOrEqual(0.85)
      expect(c.flowScale.su).toBeLessThanOrEqual(1.2)
    }
  })
})
