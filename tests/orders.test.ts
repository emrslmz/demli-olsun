import { describe, expect, it } from 'vitest'
import { STAGES } from '@/config/gameplay'
import { basePatience, effectiveGauge, orderPatience, stageFor } from '@/core/difficulty'
import { generateOrder } from '@/core/orders'
import { Rng } from '@/core/rng'
import { FILL_TYPES, TEA_TYPES } from '@/data/orderTypes'

describe('difficulty', () => {
  it('aşamalar servis sayısına göre', () => {
    expect(stageFor(0).stage).toBe(1)
    expect(stageFor(4).stage).toBe(1)
    expect(stageFor(5).stage).toBe(2)
    expect(stageFor(15).stage).toBe(3)
    expect(stageFor(30).stage).toBe(4)
    expect(stageFor(50).stage).toBe(5)
    expect(stageFor(500).stage).toBe(5)
  })

  it('aşama 5 sabrı 11 sn’den başlayıp en az 8’e iner', () => {
    expect(basePatience(50)).toBe(11)
    expect(basePatience(70)).toBeLessThan(11)
    expect(basePatience(1000)).toBe(8)
  })

  it('taksici %40 daha kısa sabırlı, tepsi bardak sayısıyla ölçeklenir', () => {
    expect(orderPatience(0, 0.6)).toBeCloseTo(15)
    expect(orderPatience(50, 1, 4)).toBeCloseTo(11 * 4 * 0.75)
  })

  it('renk körlüğü ve Usta Gözü göstergeyi rakamlı yapar', () => {
    expect(effectiveGauge('none', { colorBlind: true })).toBe('numbers')
    expect(effectiveGauge('marks', { ustaGozu: true })).toBe('numbers')
    expect(effectiveGauge('marks', {})).toBe('marks')
  })
})

describe('orders', () => {
  it('hedefler tip aralıklarında tam sayı', () => {
    const rng = new Rng('orders')
    for (let i = 0; i < 300; i++) {
      const stage = STAGES[i % STAGES.length]!
      const o = generateOrder(rng, { served: stage.fromServed, stage, nextId: i })
      const [d0, d1] = TEA_TYPES[o.teaType].dem
      const [f0, f1] = FILL_TYPES[o.fillType].fill
      expect(Number.isInteger(o.demTarget)).toBe(true)
      expect(o.demTarget).toBeGreaterThanOrEqual(d0)
      expect(o.demTarget).toBeLessThanOrEqual(d1)
      expect(o.fillTarget).toBeGreaterThanOrEqual(f0)
      expect(o.fillTarget).toBeLessThanOrEqual(f1)
      expect(stage.glasses).toContain(o.glass)
      if (stage.sugarChance === 0) expect(o.sugar).toBe(0)
      expect(o.sugar).toBeLessThanOrEqual(3)
    }
  })

  it('esnaf aşama 5’ten önce gelmez; tepsi yalnızca aşama 5’te', () => {
    const rng = new Rng('esnaf')
    for (let i = 0; i < 200; i++) {
      const o = generateOrder(rng, { served: 20, stage: stageFor(20), nextId: i })
      expect(o.customer).not.toBe('esnaf')
      expect(o.trayCount).toBe(1)
    }
    let trays = 0
    for (let i = 0; i < 400; i++) {
      const o = generateOrder(rng, { served: 60, stage: stageFor(60), nextId: i })
      if (o.trayCount > 1) {
        trays++
        expect(o.customer).toBe('esnaf')
        expect(o.trayCount).toBeGreaterThanOrEqual(3)
        expect(o.trayCount).toBeLessThanOrEqual(4)
      }
    }
    expect(trays).toBeGreaterThan(0)
  })

  it('aynı seed aynı sipariş dizisini üretir', () => {
    const a = new Rng('x')
    const b = new Rng('x')
    for (let i = 0; i < 20; i++) {
      const ctx = { served: i, stage: stageFor(i), nextId: i }
      expect(generateOrder(a, ctx)).toEqual(generateOrder(b, ctx))
    }
  })

  it('müşteri tercihleri: üniversiteli açık/tavşan kanı, muhtar demli/koyu', () => {
    const rng = new Rng('pref')
    for (let i = 0; i < 400; i++) {
      const o = generateOrder(rng, { served: 30, stage: stageFor(30), nextId: i })
      if (o.customer === 'ogrenci') expect(['acik', 'tavsan']).toContain(o.teaType)
      if (o.customer === 'muhtar') expect(['demli', 'koyu']).toContain(o.teaType)
    }
  })
})
