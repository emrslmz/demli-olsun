import { describe, expect, it } from 'vitest'
import { hashString, Rng } from '@/core/rng'

describe('rng', () => {
  it('aynı seed aynı diziyi üretir', () => {
    const a = new Rng('demli')
    const b = new Rng('demli')
    for (let i = 0; i < 50; i++) expect(a.next()).toBe(b.next())
  })

  it('farklı seed farklı dizi üretir', () => {
    const a = new Rng('demli-1')
    const b = new Rng('demli-2')
    const same = Array.from({ length: 20 }, () => a.next() === b.next()).filter(Boolean).length
    expect(same).toBeLessThan(2)
  })

  it('int aralığı iki uç dahil', () => {
    const r = new Rng(7)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const v = r.int(30, 40)
      expect(v).toBeGreaterThanOrEqual(30)
      expect(v).toBeLessThanOrEqual(40)
      seen.add(v)
    }
    expect(seen.size).toBe(11)
  })

  it('weighted sıfır ağırlıklıyı seçmez', () => {
    const r = new Rng('w')
    for (let i = 0; i < 500; i++) expect(r.weighted(['a', 'b', 'c'], [1, 0, 2])).not.toBe('b')
  })

  it('normal dağılım ortalaması ve sapması makul', () => {
    const r = new Rng('n')
    const xs = Array.from({ length: 5000 }, () => r.normal(82, 9))
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length
    const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length)
    expect(mean).toBeGreaterThan(81)
    expect(mean).toBeLessThan(83)
    expect(sd).toBeGreaterThan(8.3)
    expect(sd).toBeLessThan(9.7)
  })

  it('hashString 32 bit işaretsiz', () => {
    const h = hashString('çay')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(2 ** 32)
  })
})
