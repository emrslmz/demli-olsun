/**
 * Web Audio üzerinde tek ses servisi. Phaser'ın kendi ses yöneticisi kapalıdır (audio.noAudio).
 * Hem Vue hem Phaser bu servisi bus üzerinden ('audio:sfx') ya da doğrudan kullanır.
 * Ortam ve müzik dosyaları public/audio/manifest.json'daki yuvalardan yüklenir; dosya yoksa sessiz geçilir.
 */

import { SFX, type SfxName } from './sfx'
import { PourSynth, type PourVoice } from './pourSynth'

interface AudioManifest {
  music?: string[]
  ambient?: string[]
  /** Arada bir çalınan tek seferlik ortam sesleri (tavla zarı, "Çaycııı!"). */
  oneShots?: string[]
}

export interface AudioSettings {
  music: boolean
  musicVolume: number
  sfx: boolean
  sfxVolume: number
}

class AudioServiceImpl {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private ambientGain: GainNode | null = null
  private pour: PourSynth | null = null
  private readonly buffers = new Map<SfxName, AudioBuffer>()
  private building: Promise<void> | null = null
  private settings: AudioSettings = { music: true, musicVolume: 0.6, sfx: true, sfxVolume: 0.8 }
  private interrupted = false
  private backgrounded = false
  private musicBuffers: AudioBuffer[] = []
  private ambientBuffers: AudioBuffer[] = []
  private oneShotBuffers: AudioBuffer[] = []
  private musicSource: AudioBufferSourceNode | null = null
  private ambientSource: AudioBufferSourceNode | null = null
  private manifestLoaded = false
  private oneShotTimer: number | null = null
  private wantAmbient = false

  /** İlk kullanıcı dokunuşunda çağrılır: AudioContext'i oluşturur ve resume eder. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.connect(this.ctx.destination)
      this.sfxGain = this.ctx.createGain()
      this.sfxGain.connect(this.master)
      this.musicGain = this.ctx.createGain()
      this.musicGain.connect(this.master)
      this.ambientGain = this.ctx.createGain()
      this.ambientGain.connect(this.master)
      this.pour = new PourSynth(this.ctx, this.sfxGain)
      this.applySettings()
      void this.buildSfx()
      void this.loadManifest()
    }
    if (this.ctx.state === 'suspended' && !this.backgrounded && !this.interrupted) void this.ctx.resume()
  }

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running'
  }

  private buildSfx(): Promise<void> {
    if (this.building) return this.building
    this.building = (async () => {
      const mod = await import('zzfx')
      const Z = mod.ZZFX as {
        audioContext?: AudioContext
        sampleRate: number
        buildSamples: (...p: (number | undefined)[]) => number[]
      }
      // ZzFX modülü kendi AudioContext'ini oluşturur; kullanmıyoruz, kapatıyoruz.
      try {
        void Z.audioContext?.close()
      } catch {
        /* yok say */
      }
      const ctx = this.ctx
      if (!ctx) return
      for (const [name, params] of Object.entries(SFX) as [SfxName, (number | undefined)[]][]) {
        const samples = Z.buildSamples(...params)
        const buf = ctx.createBuffer(1, Math.max(1, samples.length), Z.sampleRate)
        buf.getChannelData(0).set(samples)
        this.buffers.set(name, buf)
      }
    })()
    return this.building
  }

  play(name: SfxName, opts: { rate?: number; volume?: number } = {}): void {
    const ctx = this.ctx
    if (!ctx || !this.settings.sfx || ctx.state !== 'running') return
    const buf = this.buffers.get(name)
    if (!buf || !this.sfxGain) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = opts.rate ?? 1
    if (opts.volume !== undefined && opts.volume !== 1) {
      const g = ctx.createGain()
      g.gain.value = opts.volume
      src.connect(g).connect(this.sfxGain)
    } else {
      src.connect(this.sfxGain)
    }
    src.start()
  }

  /** Döküm sesi: her karede çağrılabilir; akış 0 olunca söner. */
  pourUpdate(voice: PourVoice, flow: number, fill: number): void {
    if (!this.pour || !this.settings.sfx || !this.ready) return
    this.pour.update(voice, flow, fill)
  }

  pourSilence(): void {
    this.pour?.silence()
  }

  setSettings(s: AudioSettings): void {
    this.settings = { ...s }
    this.applySettings()
  }

  private applySettings(): void {
    if (!this.ctx || !this.sfxGain || !this.musicGain || !this.ambientGain) return
    const t = this.ctx.currentTime
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx ? this.settings.sfxVolume : 0, t, 0.02)
    this.musicGain.gain.setTargetAtTime(this.settings.music ? this.settings.musicVolume * 0.7 : 0, t, 0.05)
    this.ambientGain.gain.setTargetAtTime(this.settings.sfx ? this.settings.sfxVolume * 0.35 : 0, t, 0.05)
    if (!this.settings.sfx) this.pour?.silence()
  }

  /** Reklam / satın alma ekranı: ses kısılır, kapanınca geri gelir. */
  setInterrupted(on: boolean): void {
    this.interrupted = on
    this.syncRunning()
  }

  setBackgrounded(on: boolean): void {
    this.backgrounded = on
    this.syncRunning()
  }

  private syncRunning(): void {
    const ctx = this.ctx
    if (!ctx) return
    if (this.interrupted || this.backgrounded) {
      this.pour?.silence()
      if (ctx.state === 'running') void ctx.suspend()
    } else if (ctx.state === 'suspended') {
      void ctx.resume()
    }
  }

  private async fetchBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const data = await res.arrayBuffer()
      return await this.ctx.decodeAudioData(data)
    } catch {
      return null
    }
  }

  private async loadManifest(): Promise<void> {
    if (this.manifestLoaded) return
    this.manifestLoaded = true
    let manifest: AudioManifest = {}
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      if (res.ok) manifest = (await res.json()) as AudioManifest
    } catch {
      return
    }
    const base = `${import.meta.env.BASE_URL}audio/`
    const load = async (list: string[] | undefined) =>
      (await Promise.all((list ?? []).map((f) => this.fetchBuffer(base + f)))).filter(
        (b): b is AudioBuffer => !!b,
      )
    this.musicBuffers = await load(manifest.music)
    this.ambientBuffers = await load(manifest.ambient)
    this.oneShotBuffers = await load(manifest.oneShots)
    if (this.wantAmbient) this.startAmbient()
  }

  /** Menü ve oyun boyunca: müzik + kahvehane uğultusu (dosyalar varsa). */
  startAmbient(): void {
    this.wantAmbient = true
    const ctx = this.ctx
    if (!ctx) return
    if (!this.musicSource && this.musicBuffers.length > 0 && this.musicGain) {
      const src = ctx.createBufferSource()
      src.buffer = this.musicBuffers[Math.floor(Math.random() * this.musicBuffers.length)] as AudioBuffer
      src.loop = true
      src.connect(this.musicGain)
      src.start()
      this.musicSource = src
    }
    if (!this.ambientSource && this.ambientBuffers.length > 0 && this.ambientGain) {
      const src = ctx.createBufferSource()
      src.buffer = this.ambientBuffers[0] as AudioBuffer
      src.loop = true
      src.connect(this.ambientGain)
      src.start()
      this.ambientSource = src
    }
    if (this.oneShotTimer === null && this.oneShotBuffers.length > 0) this.scheduleOneShot()
  }

  private scheduleOneShot(): void {
    this.oneShotTimer = window.setTimeout(
      () => {
        this.oneShotTimer = null
        const ctx = this.ctx
        if (ctx && this.ambientGain && ctx.state === 'running' && this.wantAmbient) {
          const src = ctx.createBufferSource()
          src.buffer = this.oneShotBuffers[Math.floor(Math.random() * this.oneShotBuffers.length)] as AudioBuffer
          src.connect(this.ambientGain)
          src.start()
        }
        if (this.wantAmbient) this.scheduleOneShot()
      },
      20000 + Math.random() * 40000,
    )
  }
}

export const AudioService = new AudioServiceImpl()
export type { SfxName }
