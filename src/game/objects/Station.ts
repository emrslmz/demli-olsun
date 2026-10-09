/**
 * Servis tezgâhı: tabak + bardak, demlik (dem) ve çaydanlık (su), akış çizgileri, göstergeler,
 * şekerlik, DEM/SU basılı tutma alanları ve "Servis et". Mesai, Günlük ve Eğitim sahneleri bunu kullanır.
 */

import * as Phaser from 'phaser'
import { ANIM, OVERFLOW_AT, POUR, SUGAR, type GaugeMode, type PourSource } from '@/config/gameplay'
import type { GlassProfileId } from '@/core/glassModel'
import { PourChannel } from '@/core/pour'
import { demRatio, rgbToInt, teaColor } from '@/core/teaColor'
import type { GlassSkin } from '@/data/cosmetics'
import { tr } from '@/i18n/tr'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { ThemeService } from '@/services/theme/ThemeService'
import { potIds } from '../assets'
import type { Layout } from '../layout'
import { ChunkyButton } from './Controls'
import { DemGauge, FillGauge } from './Gauges'
import { GlassView } from './GlassView'
import { PourStream, type StreamStyle } from './PourStream'
import { Teapot } from './Teapot'

export interface StationConfig {
  glass: GlassProfileId
  skin: GlassSkin
  pot: string
  gauge: GaugeMode
  flowScale?: { dem: number; su: number }
  rand?: () => number
  reducedMotion?: boolean
}

export type StationEvent = 'serve' | 'overflow' | 'sugar' | 'pourStart' | 'pourEnd' | 'drop'

const DEM_STREAM: StreamStyle = { color: rgbToInt(teaColor(0.85)), alpha: 0.96, highlight: 0xffb07a, width: 15 }
const SU_STREAM: StreamStyle = { color: 0xd8eef8, alpha: 0.62, highlight: 0xffffff, width: 18 }

export class Station {
  readonly scene: Phaser.Scene
  readonly events = new Phaser.Events.EventEmitter()
  readonly saucer: Phaser.GameObjects.Image
  readonly glass: GlassView
  readonly demlik: Teapot
  readonly caydanlik: Teapot
  private readonly streamDem: PourStream
  private readonly streamSu: PourStream
  readonly chDem: PourChannel
  readonly chSu: PourChannel
  readonly fillGauge: FillGauge
  readonly demGauge: DemGauge
  readonly demPad: ChunkyButton
  readonly suPad: ChunkyButton
  readonly serveBtn: ChunkyButton
  readonly sugarBowl: Phaser.GameObjects.Image
  private readonly splash: Phaser.GameObjects.Particles.ParticleEmitter
  private readonly dropPool: Phaser.GameObjects.Image[] = []
  private readonly cubePool: Phaser.GameObjects.Image[] = []
  private L!: Layout
  private readonly v1 = new Phaser.Math.Vector2()
  private readonly v2 = new Phaser.Math.Vector2()
  private readonly v3 = new Phaser.Math.Vector2()

  dem = 0
  su = 0
  sugar = 0
  overflowed = false
  /** Son basılan kaynak (ikisine aynı anda basılırsa son basılan geçerli). */
  private active: PourSource | null = null
  private inputEnabled = true
  private busy = false
  private lastIncoming: PourSource | null = null
  private wasPouring = false
  private cubesInFlight = 0
  private reduced = false
  /** Sahne gösterge modu; renk körlüğü vb. dışarıda çözülür. */
  gauge: GaugeMode

  constructor(scene: Phaser.Scene, cfg: StationConfig, L: Layout) {
    this.scene = scene
    this.gauge = cfg.gauge
    this.reduced = !!cfg.reducedMotion
    const rand = cfg.rand ?? Math.random
    this.chDem = new PourChannel(POUR.dem, { rand, flowScale: cfg.flowScale?.dem ?? 1 })
    this.chSu = new PourChannel(POUR.su, { rand, flowScale: cfg.flowScale?.su ?? 1 })

    const pots = potIds(cfg.pot)
    this.demlik = new Teapot(scene, pots.demlik, false)
    this.caydanlik = new Teapot(scene, pots.caydanlik, true)
    this.demlik.image.setDepth(30)
    this.caydanlik.image.setDepth(30)

    this.sugarBowl = scene.add.image(0, 0, 'prop_sekerlik').setDepth(12).setInteractive({ useHandCursor: true })
    this.sugarBowl.on(Phaser.Input.Events.POINTER_DOWN, () => this.dropSugar())

    this.saucer = scene.add.image(0, 0, 'prop_tabak').setDepth(10)
    this.glass = new GlassView(scene, cfg.glass, cfg.skin)
    this.glass.container.setDepth(20)

    this.streamDem = new PourStream(scene)
    this.streamSu = new PourStream(scene)
    this.streamDem.gfx.setDepth(25)
    this.streamSu.gfx.setDepth(25)

    this.splash = scene.add.particles(0, 0, 'ca_dot', {
      emitting: false,
      lifespan: { min: 180, max: 380 },
      speed: { min: 60, max: 220 },
      angle: { min: 200, max: 340 },
      gravityY: 1400,
      scale: { start: 0.16, end: 0.02 },
      alpha: { start: 0.9, end: 0 },
    })
    this.splash.setDepth(26)

    this.fillGauge = new FillGauge(scene)
    this.demGauge = new DemGauge(scene)
    this.fillGauge.setDepth(35)
    this.demGauge.setDepth(35)

    const pal = ThemeService.paletteInt
    this.demPad = new ChunkyButton(scene, { color: pal.warm, icon: 'icon_dem', label: tr.game.dem, hold: true })
    this.suPad = new ChunkyButton(scene, { color: pal.accent, icon: 'icon_water', label: tr.game.water, hold: true })
    this.serveBtn = new ChunkyButton(scene, {
      color: pal.metal,
      icon: 'icon_serve',
      label: tr.game.serve,
      textColor: '#FFF6E6',
    })
    for (const b of [this.demPad, this.suPad, this.serveBtn]) b.container.setDepth(40)
    this.demPad.onDown = () => this.press('dem')
    this.demPad.onUp = () => this.release('dem')
    this.suPad.onDown = () => this.press('su')
    this.suPad.onUp = () => this.release('su')
    this.serveBtn.onUp = () => {
      if (this.canServe) this.events.emit('serve')
    }

    this.setGaugeMode(cfg.gauge)
    this.layout(L)
  }

  // ---------- Durum ----------

  get volume(): number {
    return this.dem + this.su + this.sugar * SUGAR.cubeVolume
  }

  get demPct(): number {
    return demRatio(this.dem, this.su) * 100
  }

  get fillPct(): number {
    return this.volume * 100
  }

  get canServe(): boolean {
    return this.inputEnabled && !this.busy && !this.overflowed && this.dem + this.su > 0.02 && this.cubesInFlight === 0
  }

  get isPouring(): boolean {
    return this.chDem.phase !== 'idle' || this.chSu.phase !== 'idle'
  }

  setGaugeMode(mode: GaugeMode): void {
    this.gauge = mode
    this.fillGauge.setMode(mode)
    this.demGauge.setMode(mode)
  }

  setTargets(dem: number | null, fill: number | null): void {
    this.demGauge.setTarget(dem)
    this.fillGauge.setTarget(fill)
  }

  setInputEnabled(on: boolean): void {
    this.inputEnabled = on
    if (!on) {
      this.release('dem')
      this.release('su')
      this.demPad.forceRelease()
      this.suPad.forceRelease()
    }
    this.demPad.setEnabled(on)
    this.suPad.setEnabled(on)
  }

  setBusy(b: boolean): void {
    this.busy = b
  }

  setPot(pot: string): void {
    const ids = potIds(pot)
    this.demlik.setTexture(ids.demlik)
    this.caydanlik.setTexture(ids.caydanlik)
    this.layout(this.L)
  }

  setGlass(type: GlassProfileId, skin?: GlassSkin): void {
    this.glass.setType(type, skin)
    this.layout(this.L)
  }

  /** Yeni boş bardak. */
  resetContents(): void {
    this.chDem.stop()
    this.chSu.stop()
    this.dem = 0
    this.su = 0
    this.sugar = 0
    this.overflowed = false
    this.lastIncoming = null
    this.glass.reset()
    this.streamDem.clear()
    this.streamSu.clear()
    this.demlik.setPouring(false, this.reduced)
    this.caydanlik.setPouring(false, this.reduced)
    AudioService.pourSilence()
  }

  // ---------- Giriş ----------

  press(src: PourSource): void {
    if (!this.inputEnabled || this.busy || this.overflowed) return
    const other: PourSource = src === 'dem' ? 'su' : 'dem'
    if (this.active === other) {
      this.channel(other).release()
      this.pot(other).setPouring(false, this.reduced)
      ;(other === 'dem' ? this.demPad : this.suPad).forceRelease()
    }
    this.active = src
    this.channel(src).press()
    this.pot(src).setPouring(true, this.reduced)
    this.lastIncoming = src
    this.events.emit('pourStart', src)
  }

  release(src: PourSource): void {
    const ch = this.channel(src)
    if (ch.held) {
      ch.release()
      this.events.emit('pourEnd', src)
    }
    this.pot(src).setPouring(false, this.reduced)
    if (this.active === src) this.active = null
  }

  private channel(src: PourSource): PourChannel {
    return src === 'dem' ? this.chDem : this.chSu
  }

  private pot(src: PourSource): Teapot {
    return src === 'dem' ? this.demlik : this.caydanlik
  }

  // ---------- Şeker ----------

  dropSugar(): void {
    if (!this.inputEnabled || this.busy || this.overflowed || this.sugarBowl.alpha < 0.5) return
    const cube = this.cubePool.find((c) => !c.active) ?? this.scene.add.image(0, 0, 'prop_seker').setDepth(22)
    if (!this.cubePool.includes(cube)) this.cubePool.push(cube)
    const size = 46 * this.L.u
    const from = { x: this.sugarBowl.x, y: this.sugarBowl.y - this.sugarBowl.displayHeight * 0.25 }
    const surfaceY = this.glass.surfaceWorldY()
    const topY = this.glass.topWorldY
    cube.setActive(true).setVisible(true).setAlpha(1).setDisplaySize(size, size).setPosition(from.x, from.y).setRotation(0)
    this.cubesInFlight++
    AudioService.play('tick', { rate: 1.6 })
    const midX = (from.x + this.glass.container.x) / 2
    const peakY = Math.min(from.y, topY) - 80 * this.L.u
    const state = { t: 0 }
    this.scene.tweens.add({
      targets: state,
      t: 1,
      duration: 360,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        const t = state.t
        const u = 1 - t
        cube.x = u * u * from.x + 2 * u * t * midX + t * t * this.glass.container.x
        cube.y = u * u * from.y + 2 * u * t * peakY + t * t * surfaceY
        cube.rotation = t * 3
      },
      onComplete: () => {
        this.cubesInFlight--
        this.sugar++
        this.glass.kick(1.2)
        this.splashAt(this.glass.container.x, this.glass.surfaceWorldY(), 0xfff6e6, 8)
        AudioService.play('sugarPlop')
        HapticsService.trigger('sugar')
        this.events.emit('sugar', this.sugar)
        // Küp batar ve erir
        cube.setDepth(19)
        this.scene.tweens.add({
          targets: cube,
          y: this.glass.worldYAt(0.06),
          alpha: 0,
          scale: cube.scale * 0.5,
          duration: 900,
          ease: 'Sine.easeIn',
          onComplete: () => cube.setActive(false).setVisible(false).setDepth(22),
        })
        this.checkOverflow()
      },
    })
  }

  // ---------- Kare güncellemesi ----------

  update(dt: number): void {
    const sd = this.chDem.update(dt)
    const vd = sd.volume
    const dropsD = sd.drops
    const ss = this.chSu.update(dt)
    const vs = ss.volume
    const dropsS = ss.drops
    if (!this.overflowed) {
      this.dem += vd
      this.su += vs
    }
    if (dropsD > 0) this.spawnDrop('dem')
    if (dropsS > 0) this.spawnDrop('su')

    const ratio = demRatio(this.dem, this.su)
    const incoming: PourSource | null = vd > vs ? 'dem' : vs > 0 ? 'su' : null
    this.glass.setContents(this.volume, ratio, incoming ?? (vd + vs > 0 ? this.lastIncoming : null))
    const flowR = Math.max(this.chDem.ratio, this.chSu.ratio)
    if (flowR > 0) this.glass.agitate(0.35 + 0.65 * flowR)
    this.glass.update(dt)
    this.demlik.update(dt)
    this.caydanlik.update(dt)

    // Akış çizgileri
    this.drawStream(dt, 'dem')
    this.drawStream(dt, 'su')

    // Ses ve titreşim
    const loud = this.chDem.ratio >= this.chSu.ratio ? 'dem' : 'su'
    const ch = loud === 'dem' ? this.chDem : this.chSu
    if (ch.streaming) {
      AudioService.pourUpdate(loud, ch.ratio, Math.min(1, this.volume))
      HapticsService.pourTick(ch.ratio)
      this.wasPouring = true
    } else if (this.wasPouring) {
      AudioService.pourUpdate(loud, 0, Math.min(1, this.volume))
      this.wasPouring = false
    }

    // Göstergeler
    this.fillGauge.setValue(this.fillPct)
    this.demGauge.setValue(this.demPct, this.dem + this.su > 0.003)

    this.demPad.setHighlight(this.chDem.streaming ? this.chDem.ratio : 0)
    this.suPad.setHighlight(this.chSu.streaming ? this.chSu.ratio : 0)
    this.serveBtn.setEnabled(this.canServe)

    this.checkOverflow()
  }

  private checkOverflow(): void {
    if (this.overflowed || this.volume <= OVERFLOW_AT) return
    this.overflowed = true
    this.chDem.stop()
    this.chSu.stop()
    this.release('dem')
    this.release('su')
    this.demPad.forceRelease()
    this.suPad.forceRelease()
    AudioService.pourSilence()
    this.events.emit('overflow')
  }

  private drawStream(dt: number, src: PourSource): void {
    const ch = this.channel(src)
    const stream = src === 'dem' ? this.streamDem : this.streamSu
    if (!ch.streaming) {
      stream.clear()
      return
    }
    const pot = this.pot(src)
    const from = pot.spoutWorld(this.v1)
    const dir = pot.spoutDir(this.v2)
    const to = this.v3.set(
      this.glass.container.x + (src === 'dem' ? -1 : 1) * this.glass.worldRadiusAt(this.glass.levelH()) * 0.25,
      this.glass.surfaceWorldY(),
    )
    const style = src === 'dem' ? DEM_STREAM : SU_STREAM
    const sized = { ...style, width: style.width * this.L.u * 1.4 }
    stream.draw(dt, from, dir, to, ch.ratio * Math.min(1, 0.3 + pot.tiltRatio), ch.held, sized)
    // Temas noktasında sıçrama
    if (ch.ratio > 0.15 && Math.random() < ch.ratio * 0.9) {
      this.splash.setParticleTint(style.color)
      this.splash.emitParticleAt(to.x, to.y, 1)
    }
  }

  private splashAt(x: number, y: number, tint: number, n: number): void {
    this.splash.setParticleTint(tint)
    this.splash.emitParticleAt(x, y, n)
  }

  private spawnDrop(src: PourSource): void {
    const pot = this.pot(src)
    const from = pot.spoutWorld(this.v1)
    const drop = this.dropPool.find((d) => !d.active) ?? this.scene.add.image(0, 0, 'ca_drop').setDepth(25)
    if (!this.dropPool.includes(drop)) this.dropPool.push(drop)
    const style = src === 'dem' ? DEM_STREAM : SU_STREAM
    const s = 16 * this.L.u
    drop.setActive(true).setVisible(true).setPosition(from.x, from.y).setDisplaySize(s * 0.7, s).setTint(style.color).setAlpha(0.95)
    const toX = this.glass.container.x + (src === 'dem' ? -1 : 1) * this.glass.worldRadiusAt(this.glass.levelH()) * 0.2
    this.scene.tweens.add({
      targets: drop,
      x: toX,
      y: this.glass.surfaceWorldY(),
      duration: 150,
      ease: 'Quad.easeIn',
      onComplete: () => {
        drop.setActive(false).setVisible(false)
        this.glass.kick(0.35)
        this.splashAt(toX, this.glass.surfaceWorldY(), style.color, 3)
        AudioService.play('drop', { rate: 0.9 + Math.random() * 0.3 })
        HapticsService.trigger('drop')
        this.events.emit('drop', src)
      },
    })
  }

  // ---------- Animasyonlar ----------

  /** Bardak + tabak sağa kayarak çıkar (tepsiyle). */
  slideOut(withTray: Phaser.GameObjects.Image | null): Promise<void> {
    const dist = this.L.W - this.glass.container.x + 300 * this.L.u
    const targets: Phaser.GameObjects.GameObject[] = [this.glass.container, this.saucer]
    if (withTray) targets.push(withTray)
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets,
        x: `+=${dist}`,
        duration: ANIM.serveSlide * 1000,
        ease: 'Back.easeIn',
        onComplete: () => resolve(),
      })
    })
  }

  /** Soldan tabağıyla yeni boş bardak gelir. */
  slideIn(): Promise<void> {
    const L = this.L
    const startX = -300 * L.u
    this.glass.container.x = startX
    this.saucer.x = startX
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: [this.glass.container, this.saucer],
        x: L.glassCx,
        duration: ANIM.serveSlide * 1000,
        ease: 'Back.easeOut',
        onComplete: () => {
          AudioService.play('glassTick')
          resolve()
        },
      })
    })
  }

  // ---------- Yerleşim ----------

  layout(L: Layout): void {
    this.L = L
    const u = L.u
    this.saucer.setPosition(L.saucer.cx, L.saucer.y).setDisplaySize(L.saucer.w, L.saucer.w)
    // Tabak görselinde tabak dikey merkezde; bardak tabağın üst yüzeyine oturur.
    this.glass.place(L.glassCx, L.glassBaseY, L.glassUnit)
    this.demlik.layout(L.spoutTarget.dem, L.potWidth.demlik)
    this.caydanlik.layout(L.spoutTarget.su, L.potWidth.caydanlik)
    const bs = L.sugarBowl.size
    this.sugarBowl.setPosition(L.sugarBowl.x, L.sugarBowl.y - bs * 0.32).setDisplaySize(bs, bs)
    this.fillGauge.layout(L.fillGauge, u)
    this.demGauge.layout(L.demGauge, u)
    this.demPad.layout(L.controls.dem, u)
    this.suPad.layout(L.controls.su, u)
    this.serveBtn.layout(L.controls.serve, u)
  }

  destroy(): void {
    this.events.removeAllListeners()
    for (const o of [this.demlik, this.caydanlik, this.streamDem, this.streamSu, this.glass]) o.destroy()
    for (const o of [this.fillGauge, this.demGauge, this.demPad, this.suPad, this.serveBtn]) o.destroy()
    this.saucer.destroy()
    this.sugarBowl.destroy()
    this.splash.destroy()
    for (const d of [...this.dropPool, ...this.cubePool]) d.destroy()
  }
}
