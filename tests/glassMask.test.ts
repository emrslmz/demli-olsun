import { describe, expect, it } from 'vitest'
import { lowestOpaqueRow, profileFromRows, rowsFromAlpha } from '@/core/glassMask'
import { createGlassModel, getGlassModel } from '@/core/glassModel'

const K = 0.26

/** Önden ~15° yukarıdan bakışla iç silüet maskesi: ağız/dip elips, yanlar r(h). */
function renderMask(w: number, h: number, cx: number, yTop: number, yBot: number, r: (t: number) => number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4)
  const hpx = yBot - yTop
  const rTop = r(1)
  const rBot = r(0)
  for (let y = 0; y < h; y++) {
    let half = -1
    if (y >= yTop && y <= yBot) half = r((yBot - y) / hpx)
    else if (y < yTop && y >= yTop - rTop * K) half = rTop * Math.sqrt(1 - ((yTop - y) / (rTop * K)) ** 2)
    else if (y > yBot && y <= yBot + rBot * K) half = rBot * Math.sqrt(1 - ((y - yBot) / (rBot * K)) ** 2)
    if (half < 0) continue
    for (let x = 0; x < w; x++) {
      if (Math.abs(x + 0.5 - cx) <= half) data[(y * w + x) * 4 + 3] = 255
    }
  }
  return data
}

describe('glassMask', () => {
  it('silindir maskesinden sabit profil, ağız ve dip çıkar', () => {
    const w = 200
    const h = 300
    const data = renderMask(w, h, 100, 40, 240, () => 50)
    const p = profileFromRows(rowsFromAlpha(data, w, h), K)
    expect(p).not.toBeNull()
    if (!p) return
    expect(p.cx).toBeCloseTo(100, 0)
    expect(Math.abs(p.yTop - 40)).toBeLessThan(2.5)
    expect(Math.abs(p.yBot - 240)).toBeLessThan(2.5)
    for (const [, r] of p.profile) expect(r).toBeCloseTo(50 / 200, 1)
  })

  it('ince belli profil maskeden geri okunur; hacim eşlemesi tutar', () => {
    const ref = getGlassModel('ince')
    const w = 320
    const h = 420
    const hpx = 320
    const data = renderMask(w, h, 160, 50, 50 + hpx, (t) => ref.radiusAt(t) * hpx)
    const p = profileFromRows(rowsFromAlpha(data, w, h), K)
    expect(p).not.toBeNull()
    if (!p) return
    const scale = (p.yBot - p.yTop) / hpx
    const m = createGlassModel({ id: 'ince', name: 'test', height: 1, profile: p.profile, wall: 0, base: 0, pathFactor: 1 })
    for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) expect(m.radiusAt(t) * scale).toBeCloseTo(ref.radiusAt(t), 1)
    for (const v of [0.25, 0.5, 0.75]) expect(Math.abs(m.heightAt(v) - ref.heightAt(v))).toBeLessThan(0.03)
  })

  it('boş ya da çok küçük maske null döner', () => {
    const w = 50
    const h = 50
    expect(profileFromRows(rowsFromAlpha(new Uint8ClampedArray(w * h * 4), w, h))).toBeNull()
    const tiny = renderMask(w, h, 25, 20, 26, () => 5)
    expect(profileFromRows(rowsFromAlpha(tiny, w, h))).toBeNull()
  })

  it('en alttaki opak satır', () => {
    const w = 10
    const h = 20
    const data = new Uint8ClampedArray(w * h * 4)
    data[(14 * w + 3) * 4 + 3] = 255
    expect(lowestOpaqueRow(data, w, h)).toBe(14)
    expect(lowestOpaqueRow(new Uint8ClampedArray(w * h * 4), w, h)).toBe(-1)
  })
})
