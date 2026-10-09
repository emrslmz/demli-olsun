/**
 * Prosedürel döküm sesi: filtrelenmiş gürültü + rezonans.
 * Bardak doldukça hava sütunu kısalır ve perde yükselir. Dem daha kalın ve yavaş,
 * su daha ince ve hızlı ses çıkarır. Ses şiddeti akış hızına bağlıdır.
 * Porselen fincanda oyuncunun asıl ipucu bu ses.
 */

export type PourVoice = 'dem' | 'su'

const VOICE = {
  dem: { base: 300, q: 7, lfoRate: 8, lfoDepth: 0.07, body: 700, gain: 0.55 },
  su: { base: 460, q: 9, lfoRate: 15, lfoDepth: 0.05, body: 1300, gain: 0.45 },
}

export class PourSynth {
  private readonly ctx: AudioContext
  private readonly out: GainNode
  private noise: AudioBufferSourceNode | null = null
  private res1: BiquadFilterNode | null = null
  private res2: BiquadFilterNode | null = null
  private body: BiquadFilterNode | null = null
  private lfo: OscillatorNode | null = null
  private lfoGain: GainNode | null = null
  private amp: GainNode | null = null
  private voice: PourVoice = 'dem'
  private running = false

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx
    this.out = ctx.createGain()
    this.out.gain.value = 1
    this.out.connect(destination)
  }

  private build(): void {
    const ctx = this.ctx
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    // Pembe gürültüye yakın: beyaz gürültü + basit tek kutuplu süzgeç.
    let last = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      last = 0.97 * last + 0.03 * white
      data[i] = white * 0.55 + last * 3
    }
    this.noise = ctx.createBufferSource()
    this.noise.buffer = buf
    this.noise.loop = true

    this.res1 = ctx.createBiquadFilter()
    this.res1.type = 'bandpass'
    this.res2 = ctx.createBiquadFilter()
    this.res2.type = 'bandpass'
    this.body = ctx.createBiquadFilter()
    this.body.type = 'lowpass'

    const g1 = ctx.createGain()
    g1.gain.value = 1
    const g2 = ctx.createGain()
    g2.gain.value = 0.45
    const g3 = ctx.createGain()
    g3.gain.value = 0.25

    this.amp = ctx.createGain()
    this.amp.gain.value = 0

    this.noise.connect(this.res1).connect(g1).connect(this.amp)
    this.noise.connect(this.res2).connect(g2).connect(this.amp)
    this.noise.connect(this.body).connect(g3).connect(this.amp)
    this.amp.connect(this.out)

    // Fokurtu: rezonans frekansını hafifçe salınım yaptır.
    this.lfo = ctx.createOscillator()
    this.lfo.type = 'triangle'
    this.lfoGain = ctx.createGain()
    this.lfo.connect(this.lfoGain)
    this.lfoGain.connect(this.res1.frequency)
    this.noise.start()
    this.lfo.start()
  }

  /** flow: 0..1 akış oranı, fill: 0..1 doluluk. flow 0 iken ses söner. */
  update(voice: PourVoice, flow: number, fill: number): void {
    if (!this.running) {
      if (flow <= 0.001) return
      if (!this.noise) this.build()
      this.running = true
    }
    const v = VOICE[voice]
    const t = this.ctx.currentTime
    const f = Math.min(2800, v.base / (1 - 0.82 * Math.max(0, Math.min(1, fill))))
    const res1 = this.res1 as BiquadFilterNode
    const res2 = this.res2 as BiquadFilterNode
    const body = this.body as BiquadFilterNode
    res1.frequency.setTargetAtTime(f, t, 0.03)
    res1.Q.setTargetAtTime(v.q, t, 0.05)
    res2.frequency.setTargetAtTime(f * 1.52, t, 0.03)
    res2.Q.setTargetAtTime(v.q * 1.4, t, 0.05)
    body.frequency.setTargetAtTime(v.body, t, 0.05)
    if (this.voice !== voice || !this.lfo) {
      this.voice = voice
    }
    ;(this.lfo as OscillatorNode).frequency.setTargetAtTime(v.lfoRate, t, 0.05)
    ;(this.lfoGain as GainNode).gain.setTargetAtTime(f * v.lfoDepth, t, 0.05)
    const target = Math.pow(Math.max(0, Math.min(1, flow)), 0.7) * v.gain
    ;(this.amp as GainNode).gain.setTargetAtTime(target, t, flow > 0.01 ? 0.03 : 0.06)
    if (flow <= 0.001) this.running = false
  }

  silence(): void {
    if (!this.amp) return
    this.amp.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04)
    this.running = false
  }
}
