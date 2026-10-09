/**
 * Döküm kanalı: basılı tutunca akış rampUp süresinde yumuşakça en yüksek hıza çıkar,
 * bırakınca artık akış üstel olarak söner ve ardından birkaç damla daha düşer.
 */

import { POUR_TAIL, type FlowParams } from '@/config/gameplay'

export type PourPhase = 'idle' | 'flowing' | 'tail' | 'drops'

export interface PourTailConfig {
  cutoffRatio: number
  dropCount: [number, number]
  dropVolume: number
  dropInterval: [number, number]
  substep: number
}

export interface PourStep {
  /** Bu adımda bardağa giren hacim (kapasite oranı). */
  volume: number
  /** Bu adımda düşen damla sayısı. */
  drops: number
}

export class PourChannel {
  readonly params: FlowParams
  private readonly tail: PourTailConfig
  private readonly rand: () => number
  /** Akış hızı çarpanı (Günün Siparişi gibi modlarda seed'den gelir). */
  flowScale: number

  flow = 0
  phase: PourPhase = 'idle'
  private holdTime = 0
  private dropsLeft = 0
  private dropTimer = 0
  private readonly out: PourStep = { volume: 0, drops: 0 }

  constructor(params: FlowParams, opts: { rand?: () => number; tail?: PourTailConfig; flowScale?: number } = {}) {
    this.params = params
    this.tail = opts.tail ?? POUR_TAIL
    this.rand = opts.rand ?? Math.random
    this.flowScale = opts.flowScale ?? 1
  }

  get maxFlow(): number {
    return this.params.maxFlow * this.flowScale
  }

  get held(): boolean {
    return this.phase === 'flowing'
  }

  /** Akış çizgisi görünür mü (basılı ya da artık akış sürüyor). */
  get streaming(): boolean {
    return this.phase === 'flowing' || this.phase === 'tail'
  }

  /** 0..1 akış oranı. */
  get ratio(): number {
    const m = this.maxFlow
    return m > 0 ? Math.min(1, this.flow / m) : 0
  }

  press(): void {
    if (this.phase === 'flowing') return
    // Artık akış sürerken yeniden basılırsa rampa mevcut akıştan devam eder.
    const f = Math.min(1, this.ratio)
    this.holdTime = this.params.rampUp * (1 - Math.sqrt(1 - f))
    this.phase = 'flowing'
    this.dropsLeft = 0
  }

  release(): void {
    if (this.phase !== 'flowing') return
    this.phase = this.flow > 0 ? 'tail' : 'idle'
    if (this.phase === 'tail' && this.flow < this.tail.cutoffRatio * this.maxFlow) this.startDrops()
  }

  /** Her şeyi anında durdurur (yeni bardak, sahne sıfırlama). */
  stop(): void {
    this.phase = 'idle'
    this.flow = 0
    this.holdTime = 0
    this.dropsLeft = 0
  }

  private startDrops(): void {
    const [a, b] = this.tail.dropCount
    this.flow = 0
    this.dropsLeft = a + Math.floor(this.rand() * (b - a + 1))
    this.dropTimer = this.nextDropInterval()
    this.phase = this.dropsLeft > 0 ? 'drops' : 'idle'
  }

  private nextDropInterval(): number {
    const [a, b] = this.tail.dropInterval
    return a + (b - a) * this.rand()
  }

  /** dt saniye ilerletir. Dönen nesne yeniden kullanılır (karede bellek ayırmaz). */
  update(dt: number): PourStep {
    const out = this.out
    out.volume = 0
    out.drops = 0
    if (this.phase === 'idle' || dt <= 0) return out
    let remaining = dt
    const sub = this.tail.substep
    while (remaining > 1e-9 && this.phase !== 'idle') {
      const s = Math.min(sub, remaining)
      remaining -= s
      if (this.phase === 'flowing') {
        const rampUp = this.params.rampUp
        const t0 = rampUp > 0 ? Math.min(1, this.holdTime / rampUp) : 1
        this.holdTime += s
        const t1 = rampUp > 0 ? Math.min(1, this.holdTime / rampUp) : 1
        const f0 = this.maxFlow * (1 - (1 - t0) * (1 - t0))
        const f1 = this.maxFlow * (1 - (1 - t1) * (1 - t1))
        out.volume += ((f0 + f1) / 2) * s
        this.flow = f1
      } else if (this.phase === 'tail') {
        const tau = this.params.tau
        const k = Math.exp(-s / tau)
        out.volume += this.flow * tau * (1 - k)
        this.flow *= k
        if (this.flow < this.tail.cutoffRatio * this.maxFlow) this.startDrops()
      } else if (this.phase === 'drops') {
        this.dropTimer -= s
        if (this.dropTimer <= 0) {
          out.volume += this.tail.dropVolume
          out.drops += 1
          this.dropsLeft -= 1
          if (this.dropsLeft <= 0) this.phase = 'idle'
          else this.dropTimer = this.nextDropInterval()
        }
      }
    }
    return out
  }
}

/** Tam akıştayken bırakıldığında beklenen artık hacim (damlalar hariç). */
export function expectedTailVolume(params: FlowParams, tail: PourTailConfig = POUR_TAIL): number {
  return params.maxFlow * params.tau * (1 - tail.cutoffRatio)
}
