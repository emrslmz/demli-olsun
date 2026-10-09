import { describe, expect, it } from 'vitest'
import { computeLayout } from '@/game/layout'

const SIZES: [string, number, number, number, { top: number; bottom: number }][] = [
  ['720×1280', 720, 1280, 1, { top: 0, bottom: 0 }],
  ['1080×2400 (DPR 2)', 540, 1200, 2, { top: 24, bottom: 16 }],
  ['iPhone çentikli', 390, 844, 2, { top: 47, bottom: 34 }],
  ['9:21', 360, 840, 2, { top: 30, bottom: 20 }],
  ['iPad 4:3', 768, 1024, 2, { top: 24, bottom: 20 }],
  ['Android tablet 16:10', 800, 1280, 2, { top: 24, bottom: 24 }],
]

describe('layout', () => {
  for (const [name, w, h, dpr, safe] of SIZES) {
    describe(name, () => {
      const W = w * dpr
      const H = h * dpr
      const L = computeLayout(W, H, dpr, { top: safe.top, bottom: safe.bottom, left: 0, right: 0 })

      it('arka plan ekranı boşluksuz kaplar', () => {
        expect(L.bg.x).toBeLessThanOrEqual(0.5)
        expect(L.bg.y).toBeLessThanOrEqual(0.5)
        expect(L.bg.x + L.bg.srcW * L.bg.scale).toBeGreaterThanOrEqual(W - 0.5)
        expect(L.bg.y + L.bg.srcH * L.bg.scale).toBeGreaterThanOrEqual(H - 0.5)
      })

      it('tezgâh çizgisi arka planın counterY çizgisine denk gelir', () => {
        const bgCounter = L.bg.y + 0.68 * L.bg.srcH * L.bg.scale
        expect(Math.abs(bgCounter - L.counterY)).toBeLessThan(1)
      })

      it('DEM/SU alanları alt %20 içinde ve en az 56dp', () => {
        expect(L.controls.dem.y).toBeGreaterThanOrEqual(H * 0.8 - 1)
        expect(L.controls.dem.h).toBeGreaterThanOrEqual(56 * dpr)
        expect(L.controls.su.w).toBeGreaterThanOrEqual(56 * dpr)
        expect(L.controls.dem.y + L.controls.dem.h).toBeLessThanOrEqual(H - safe.bottom * dpr)
      })

      it('HUD safe area altında başlar, öğeler üst üste binmez', () => {
        expect(L.hud.y).toBeGreaterThanOrEqual(safe.top * dpr)
        expect(L.board.y).toBeGreaterThan(L.hud.y + L.hud.h - 1)
        expect(L.counterY).toBeGreaterThan(L.board.y + L.board.h)
        expect(L.glassBaseY - L.glassUnit * 1.12).toBeGreaterThan(L.board.y + L.board.h)
        expect(L.controls.dem.y).toBeGreaterThan(L.counterY)
      })

      it('kart sayısı 3 ya da 4', () => {
        expect([3, 4]).toContain(L.cardSlots)
      })
    })
  }

  it('telefonda phone, tablette tablet arka planı seçilir', () => {
    expect(computeLayout(1080, 1920, 1, { top: 0, bottom: 0, left: 0, right: 0 }).bg.variant).toBe('phone')
    expect(computeLayout(1536, 2048, 1, { top: 0, bottom: 0, left: 0, right: 0 }).bg.variant).toBe('tablet')
  })

  it('tablette içerik kolonu ortalanır ve sınırlanır', () => {
    const L = computeLayout(1536, 2048, 2, { top: 0, bottom: 0, left: 0, right: 0 })
    expect(L.col.w).toBeLessThan(1536)
    expect(L.col.cx).toBeCloseTo(768, 0)
    expect(L.cardSlots).toBe(4)
  })
})
