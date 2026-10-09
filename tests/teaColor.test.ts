import { describe, expect, it } from 'vitest'
import { demRatio, effectiveDem, luminance, teaColor } from '@/core/teaColor'

describe('teaColor', () => {
  it('renk eğrisi monoton: dem arttıkça koyulaşır, opaklık artar', () => {
    let prevL = Infinity
    let prevA = -Infinity
    for (let i = 0; i <= 200; i++) {
      const c = teaColor(i / 200)
      const L = luminance(c)
      expect(L).toBeLessThanOrEqual(prevL + 1e-9)
      expect(c.a).toBeGreaterThanOrEqual(prevA - 1e-9)
      prevL = L
      prevA = c.a
    }
  })

  it('kanallar ayrı ayrı monoton', () => {
    let prev = teaColor(0)
    for (let i = 1; i <= 100; i++) {
      const c = teaColor(i / 100)
      expect(c.r).toBeLessThanOrEqual(prev.r)
      expect(c.g).toBeLessThanOrEqual(prev.g)
      expect(c.b).toBeLessThanOrEqual(prev.b)
      prev = c
    }
  })

  it('renk durakları dokümandaki tarife uyar', () => {
    const water = teaColor(0)
    expect(water.a).toBeLessThan(0.25)
    const tavsan = teaColor(0.35)
    expect(tavsan.r).toBeGreaterThan(tavsan.g * 2)
    const koyu = teaColor(0.8)
    expect(koyu.a).toBeGreaterThan(0.95)
    expect(luminance(koyu)).toBeLessThan(0.05)
  })

  it('geniş bardak (uzun ışık yolu) daha koyu görünür', () => {
    for (const d of [0.2, 0.35, 0.5]) {
      expect(luminance(teaColor(d, 1.35))).toBeLessThan(luminance(teaColor(d, 1)))
    }
    expect(effectiveDem(0.3, 1)).toBeCloseTo(0.3)
  })

  it('dem oranı', () => {
    expect(demRatio(0, 0)).toBe(0)
    expect(demRatio(0.35, 0.65)).toBeCloseTo(0.35)
    expect(demRatio(1, 0)).toBe(1)
  })
})
