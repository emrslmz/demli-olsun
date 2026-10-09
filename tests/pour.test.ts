import { describe, expect, it } from 'vitest'
import { POUR, POUR_TAIL } from '@/config/gameplay'
import { expectedTailVolume, PourChannel } from '@/core/pour'

function run(ch: PourChannel, seconds: number, dt = 1 / 60) {
  let vol = 0
  let drops = 0
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    const s = ch.update(dt)
    vol += s.volume
    drops += s.drops
  }
  return { vol, drops }
}

const fixedRand = () => 0.5

describe('pour', () => {
  for (const src of ['dem', 'su'] as const) {
    describe(src, () => {
      const p = POUR[src]

      it('rampUp sonunda en yüksek akışa ulaşır', () => {
        const ch = new PourChannel(p, { rand: fixedRand })
        ch.press()
        run(ch, p.rampUp * 0.5)
        expect(ch.flow).toBeLessThan(p.maxFlow)
        expect(ch.flow).toBeGreaterThan(0)
        run(ch, p.rampUp)
        expect(ch.flow).toBeCloseTo(p.maxFlow, 6)
      })

      it('sabit akışta hacim süreyle orantılı', () => {
        const ch = new PourChannel(p, { rand: fixedRand })
        ch.press()
        run(ch, 0.5)
        const before = run(ch, 1).vol
        expect(before).toBeCloseTo(p.maxFlow, 3)
      })

      it('artık akış miktarı beklenen aralıkta', () => {
        const ch = new PourChannel(p, { rand: fixedRand })
        ch.press()
        run(ch, 1)
        ch.release()
        expect(ch.phase).toBe('tail')
        const r = run(ch, 2)
        expect(ch.phase).toBe('idle')
        const expected = expectedTailVolume(p)
        const dropsVol = r.drops * POUR_TAIL.dropVolume
        expect(r.vol - dropsVol).toBeCloseTo(expected, 3)
        expect(r.drops).toBeGreaterThanOrEqual(POUR_TAIL.dropCount[0])
        expect(r.drops).toBeLessThanOrEqual(POUR_TAIL.dropCount[1])
        // Oyuncunun öğrenmesi gereken toplam artık: kapasitenin %1.5–%4'ü
        expect(r.vol).toBeGreaterThan(0.015)
        expect(r.vol).toBeLessThan(0.04)
      })

      it('kare hızından bağımsız', () => {
        const a = new PourChannel(p, { rand: fixedRand })
        const b = new PourChannel(p, { rand: fixedRand })
        a.press()
        b.press()
        const va = run(a, 0.7, 1 / 30).vol
        const vb = run(b, 0.7, 1 / 144).vol
        expect(va).toBeCloseTo(vb, 3)
      })
    })
  }

  it('artık akış sırasında yeniden basınca rampa mevcut akıştan devam eder', () => {
    const ch = new PourChannel(POUR.dem, { rand: fixedRand })
    ch.press()
    run(ch, 1)
    ch.release()
    run(ch, 0.03)
    const f = ch.flow
    ch.press()
    ch.update(1 / 240)
    expect(ch.flow).toBeGreaterThanOrEqual(f * 0.95)
  })

  it('stop her şeyi anında durdurur', () => {
    const ch = new PourChannel(POUR.su, { rand: fixedRand })
    ch.press()
    run(ch, 0.5)
    ch.stop()
    expect(ch.update(0.1).volume).toBe(0)
    expect(ch.phase).toBe('idle')
  })

  it('flowScale akışı ölçekler', () => {
    const ch = new PourChannel(POUR.dem, { rand: fixedRand, flowScale: 1.2 })
    ch.press()
    run(ch, 0.5)
    expect(ch.flow).toBeCloseTo(POUR.dem.maxFlow * 1.2, 6)
  })
})
