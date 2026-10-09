import { describe, expect, it } from 'vitest'
import { createMonotoneSpline, getGlassModel, GLASS_DEFS, type GlassProfileId } from '@/core/glassModel'

const IDS = Object.keys(GLASS_DEFS) as GlassProfileId[]

describe('glassModel', () => {
  for (const id of IDS) {
    describe(id, () => {
      const m = getGlassModel(id)

      it('uç değerler doğru', () => {
        expect(m.volumeAt(0)).toBe(0)
        expect(m.volumeAt(1)).toBe(1)
        expect(m.heightAt(0)).toBe(0)
        expect(m.heightAt(1)).toBe(1)
        expect(m.heightAt(1.3)).toBe(1)
        expect(m.volumeAt(-0.1)).toBe(0)
      })

      it('hacim tablosu monoton artar', () => {
        let prev = -1
        for (let i = 0; i <= 400; i++) {
          const v = m.volumeAt(i / 400)
          expect(v).toBeGreaterThanOrEqual(prev)
          prev = v
        }
      })

      it('hacim ↔ yükseklik ters fonksiyon', () => {
        for (let i = 1; i < 50; i++) {
          const v = i / 50
          expect(m.volumeAt(m.heightAt(v))).toBeCloseTo(v, 3)
        }
      })

      it('yarıçap her yerde pozitif', () => {
        for (let i = 0; i <= 100; i++) expect(m.radiusAt(i / 100)).toBeGreaterThan(0)
      })
    })
  }

  it('ince belli bardakta seviye belde hızlanır', () => {
    const m = getGlassModel('ince')
    const dhdv = (h: number) => {
      const e = 0.01
      return (2 * e) / (m.volumeAt(h + e) - m.volumeAt(h - e))
    }
    const waist = dhdv(0.4)
    expect(waist).toBeGreaterThan(dhdv(0.15) * 1.3)
    expect(waist).toBeGreaterThan(dhdv(0.9) * 2)
  })

  it('düz bardak doğrusala yakın', () => {
    const m = getGlassModel('duz')
    for (let i = 1; i < 10; i++) expect(Math.abs(m.heightAt(i / 10) - i / 10)).toBeLessThan(0.08)
  })

  it('monoton spline kontrol noktalarından geçer ve taşmaz', () => {
    const pts: [number, number][] = [
      [0, 1],
      [0.5, 0.2],
      [1, 0.8],
    ]
    const f = createMonotoneSpline(pts)
    expect(f(0)).toBeCloseTo(1)
    expect(f(0.5)).toBeCloseTo(0.2)
    expect(f(1)).toBeCloseTo(0.8)
    for (let i = 0; i <= 100; i++) {
      const y = f(i / 100)
      expect(y).toBeGreaterThanOrEqual(0.2 - 1e-9)
      expect(y).toBeLessThanOrEqual(1 + 1e-9)
    }
  })
})
