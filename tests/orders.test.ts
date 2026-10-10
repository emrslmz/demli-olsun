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
    expect(stageFor(12).stage).toBe(3)
    expect(stageFor(24).stage).toBe(4)
    expect(stageFor(40).stage).toBe(5)
    expect(stageFor(500).stage).toBe(5)
  })

  it('aşama 5 sabrı 13 sn’den başlayıp en az 9’a iner', () => {
    expect(basePatience(40)).toBe(13)
    expect(basePatience(60)).toBeLessThan(13)
    expect(basePatience(1000)).toBe(9)
  })

  it('taksici %40 daha kısa sabırlı', () => {
    expect(orderPatience(0, 0.6)).toBeCloseTo(24 * 0.6)
    expect(orderPatience(0, 1)).toBe(24)
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
      if (stage.sugarChance === 0) expect(o.sugar).toBe(0)
      expect(o.sugar).toBeLessThanOrEqual(3)
    }
  })

  it('esnaf aşama 3’ten önce gelmez, sonra gelir', () => {
    const rng = new Rng('esnaf')
    for (let i = 0; i < 200; i++) {
      const o = generateOrder(rng, { served: 6, stage: stageFor(6), nextId: i })
      expect(o.customer).not.toBe('esnaf')
    }
    let esnaf = 0
    for (let i = 0; i < 300; i++) {
      const o = generateOrder(rng, { served: 30, stage: stageFor(30), nextId: i })
      if (o.customer === 'esnaf') esnaf++
    }
    expect(esnaf).toBeGreaterThan(0)
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
