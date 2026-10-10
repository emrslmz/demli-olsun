/**
 * Servis tezgâhı: tabak + bardak (hedef çizgileriyle), tezgâhta dinlenen demlik (dem) ve çaydanlık (su),
 * akış çizgileri, şekerlik, DEM/SU basılı tutma alanları ve "Servis et". Mesai, Günlük ve Eğitim sahneleri bunu kullanır.
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
import { potIds } from '../assets'
import type { Layout } from '../layout'
import { ChunkyButton } from './Controls'
import { GlassView } from './GlassView'
import { PourStream, type StreamStyle } from './PourStream'
import { Teapot } from './Teapot'
import { Steam } from '../fx/Steam'

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

const DEM_STREAM: StreamStyle = { color: rgbToInt(teaColor(0.85)), alpha: 0.96, highlight: 0xffb07a, width: 22 }
const SU_STREAM: StreamStyle = { color: 0xd8eef8, alpha: 0.7, highlight: 0xffffff, width: 24 }

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
  readonly demPad: ChunkyButton
  readonly suPad: ChunkyButton
  readonly serveBtn: ChunkyButton
  readonly sugarBowl: Phaser.GameObjects.Image
  private readonly splash: Phaser.GameObjects.Particles.ParticleEmitter
  private readonly dropPool: Phaser.GameObjects.Image[] = []
  private readonly cubePool: Phaser.GameObjects.Image[] = []
  private readonly spoon: Phaser.GameObjects.Image
  private readonly glassSteam: Steam
  private readonly kettleSteam: Steam
  private readonly bubbles: Phaser.GameObjects.Particles.ParticleEmitter
  private readonly puddle: Phaser.GameObjects.Image
  private hasOrder = true
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
  /** Rehber modu: numbers → dem ve dolu çizgisi, marks → yalnız dolu çizgisi, none → çizgi yok. */
  gauge: GaugeMode
  private targetDem: number | null = null
  private targetFill: number | null = null

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
    this.puddle = scene.add.image(0, 0, 'ca_dot').setDepth(11).setVisible(false)
    this.spoon = scene.add.image(0, 0, 'prop_kasik').setDepth(21).setVisible(false)
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

    this.glassSteam = new Steam(scene, L.u, { rate: cfg.reducedMotion ? 0.4 : 0.7, depth: 24 })
    this.kettleSteam = new Steam(scene, L.u, { rate: cfg.reducedMotion ? 0.15 : 0.25, strength: 0.5, depth: 31 })
    this.kettleSteam.setActive(true)
    this.bubbles = scene.add.particles(0, 0, 'ca_ring', {
      emitting: false,
      lifespan: { min: 260, max: 620 },
      speedY: { min: -40, max: -10 },
      speedX: { min: -30, max: 30 },
      scale: { start: 0.14, end: 0.02 },
      alpha: { start: 0.8, end: 0 },
    })
    this.bubbles.setDepth(23)

    // Canlı, temadan bağımsız buton renkleri (oyun içi okunurluk)
    this.demPad = new ChunkyButton(scene, { color: 0xe8573c, icon: 'icon_dem', label: tr.game.dem, hold: true })
    this.suPad = new ChunkyButton(scene, { color: 0x2f9fd8, icon: 'icon_water', label: tr.game.water, hold: true })
    this.serveBtn = new ChunkyButton(scene, { color: 0x4cb848, icon: 'icon_serve', label: tr.game.serve })
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
    return this.inputEnabled && this.hasOrder && !this.busy && !this.overflowed && this.dem + this.su > 0.02 && this.cubesInFlight === 0
  }

  /** Aktif sipariş yokken döküm ve servis kapalı. */
  setHasOrder(on: boolean): void {
    this.hasOrder = on
    if (!on) {
      this.release('dem')
      this.release('su')
      this.demPad.forceRelease()
      this.suPad.forceRelease()
    }
    const en = on && this.inputEnabled
    this.demPad.setEnabled(en)
    this.suPad.setEnabled(en)
    this.sugarBowl.setAlpha(en ? 1 : 0.6)
  }

  get isPouring(): boolean {
    return this.chDem.phase !== 'idle' || this.chSu.phase !== 'idle'
  }

  setGaugeMode(mode: GaugeMode): void {
    this.gauge = mode
    this.applyGuides()
  }

  /** Sipariş hedefleri (yüzde). Bardakta çizgi olarak gösterilir (moda göre). */
  setTargets(dem: number | null, fill: number | null): void {
    this.targetDem = dem
    this.targetFill = fill
    this.applyGuides()
  }

  private applyGuides(): void {
    const fill = this.targetFill
    const dem = this.targetDem
    const showFill = fill !== null && this.gauge !== 'none'
    const showDem = fill !== null && dem !== null && this.gauge === 'numbers'
    this.glass.setGuides(showDem ? ((dem as number) / 100) * ((fill as number) / 100) : null, showFill ? (fill as number) / 100 : null)
  }

  setInputEnabled(on: boolean): void {
    this.inputEnabled = on
    if (!on) {
      this.release('dem')
      this.release('su')
      this.demPad.forceRelease()
      this.suPad.forceRelease()
    }
    this.demPad.setEnabled(on && this.hasOrder)
    this.suPad.setEnabled(on && this.hasOrder)
    this.sugarBowl.setAlpha(on && this.hasOrder ? 1 : 0.6)
  }

  setBusy(b: boolean): void {
    this.busy = b
  }

  /** Akışı damlasız keser (süre doldu / zorunlu servis). */
  stopPour(): void {
    this.setInputEnabled(false)
    this.chDem.stop()
    this.chSu.stop()
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
    this.puddle.setVisible(false)
    this.spoon.setVisible(false)
    this.streamDem.clear()
    this.streamSu.clear()
    this.demlik.snapToRest()
    this.caydanlik.snapToRest()
    AudioService.pourSilence()
  }

  // ---------- Giriş ----------

  press(src: PourSource): void {
    if (!this.inputEnabled || !this.hasOrder || this.busy || this.overflowed) return
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
    if (!this.inputEnabled || !this.hasOrder || this.busy || this.overflowed) return
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
    // Artık akış bitince demlik/çaydanlık tezgâhtaki yerine döner.
    if (this.chDem.phase === 'idle') this.demlik.park(this.reduced)
    if (this.chSu.phase === 'idle') this.caydanlik.park(this.reduced)

    // Akış çizgileri
    this.drawStream(dt, 'dem')
    this.drawStream(dt, 'su')

    // Buhar: bardakta çay varsa; çaydanlık ağzından hep hafif buhar
    const g = this.glass
    this.glassSteam.setActive(this.volume > 0.05 && g.container.visible)
    this.glassSteam.setPosition(g.container.x, g.surfaceWorldY() - 6 * this.L.u)
    const sp = this.caydanlik.spoutWorld(this.v1)
    this.kettleSteam.setPosition(sp.x, sp.y)
    this.kettleSteam.setActive(this.caydanlik.atRest)

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
    // Temas noktasında sıçrama ve yüzeyde kabarcıklar
    const density = this.reduced ? 0.4 : 1
    if (ch.ratio > 0.15 && Math.random() < ch.ratio * 0.9 * density) {
      this.splash.setParticleTint(style.color)
      this.splash.emitParticleAt(to.x, to.y, 1)
    }
    if (this.volume > 0.04 && Math.random() < ch.ratio * 0.5 * density) {
      const r = this.glass.worldRadiusAt(this.glass.levelH()) * 0.7
      this.bubbles.emitParticleAt(to.x + (Math.random() - 0.5) * r, to.y + (Math.random() - 0.3) * r * 0.2, 1)
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
    drop
      .setActive(true)
      .setVisible(true)
      .setPosition(from.x, from.y)
      .setDisplaySize(s * 0.7, s)
      .setTint(style.color)
      .setAlpha(0.95)
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

  /** Kaşık şıngırtısıyla kısa bir karıştırma. */
  stir(reduced = false): Promise<void> {
    const g = this.glass
    const top = g.topWorldY
    const size = g.worldRadiusAt(1) * 2.4
    this.spoon
      .setVisible(true)
      .setDisplaySize(size, size)
      .setPosition(g.container.x + size * 0.12, top - size * 0.05)
      .setAngle(-20)
      .setAlpha(0)
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: this.spoon, alpha: 1, duration: 80 })
      this.scene.tweens.add({
        targets: this.spoon,
        angle: 20,
        x: g.container.x - size * 0.12,
        duration: reduced ? 60 : 110,
        yoyo: true,
        repeat: reduced ? 0 : 2,
        ease: 'Sine.easeInOut',
        onYoyo: () => {
          AudioService.play('spoonClink', { rate: 0.95 + Math.random() * 0.15 })
          this.glass.agitate(0.9)
        },
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.spoon,
            alpha: 0,
            y: top - size * 0.4,
            duration: 140,
            onComplete: () => this.spoon.setVisible(false),
          })
          resolve()
        },
      })
    })
  }

  /** Taşma: sıvı tabağa yayılır. */
  spill(): void {
    const c = teaColor(demRatio(this.dem, this.su), this.glass.geo.model.def.pathFactor)
    const w = this.L.saucer.w
    this.puddle
      .setVisible(true)
      .setTint(rgbToInt(c))
      .setAlpha(Math.min(0.95, c.a + 0.2))
      .setPosition(this.saucer.x, this.saucer.y + w * 0.02)
      .setDisplaySize(w * 0.3, w * 0.08)
    this.scene.tweens.add({ targets: this.puddle, displayWidth: w * 1.15, displayHeight: w * 0.3, duration: 700, ease: 'Cubic.easeOut' })
    this.splashAt(this.glass.container.x, this.glass.topWorldY, rgbToInt(c), 14)
  }

  /** Servis: bardak tabağıyla müşteriye doğru kalkar, küçülür ve kaybolur. */
  serveTo(target: { x: number; y: number }): Promise<void> {
    const targets: Phaser.GameObjects.Components.Transform[] = [this.glass.container, this.saucer]
    const sx = this.glass.container.scaleX
    const ss = this.saucer.scaleX
    return new Promise((resolve) => {
      const state = { t: 0 }
      const from = targets.map((t) => ({ x: t.x, y: t.y }))
      this.scene.tweens.add({
        targets: state,
        t: 1,
        duration: ANIM.serveSlide * 1000 * 1.2,
        ease: 'Cubic.easeInOut',
        onUpdate: () => {
          const t = state.t
          const lift = Math.sin(t * Math.PI) * 60 * this.L.u
          targets.forEach((o, i) => {
            const f0 = from[i] as { x: number; y: number }
            o.x = f0.x + (target.x - f0.x) * t
            o.y = f0.y + (target.y - f0.y) * t - lift
          })
          this.glass.container.setScale(sx * (1 - 0.3 * t))
          this.saucer.setScale(ss * (1 - 0.3 * t))
          this.glass.container.setAlpha(1 - Math.max(0, t - 0.7) / 0.3)
          this.saucer.setAlpha(1 - Math.max(0, t - 0.7) / 0.3)
        },
        onComplete: () => {
          this.glass.container.setAlpha(1)
          this.saucer.setScale(ss).setAlpha(1)
          // Yeni bardak gelene kadar ekran dışında, yerleşimdeki yüksekliğinde bekler.
          this.placeGlassAt(-300 * this.L.u)
          resolve()
        },
      })
    })
  }

  /** Bardak + tabak sağa kayarak çıkar (taşma, gidilen müşteri). */
  slideOut(): Promise<void> {
    const dist = this.L.W - this.glass.container.x + 300 * this.L.u
    const targets: Phaser.GameObjects.GameObject[] = [this.glass.container, this.saucer, this.puddle]
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
    this.placeGlassAt(-300 * L.u)
    this.glass.container.setAlpha(1)
    this.saucer.setAlpha(1)
    this.puddle.setVisible(false)
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

  /** Bardak + tabak: yerleşimdeki yükseklik ve ölçek, verilen x'te. */
  private placeGlassAt(x: number): void {
    const L = this.L
    this.saucer.setPosition(x, L.saucer.y).setDisplaySize(L.saucer.w * 1.15, L.saucer.w * 1.15)
    this.glass.place(x, L.glassBaseY, L.glassUnit)
  }

  layout(L: Layout): void {
    this.L = L
    const u = L.u
    // Tabak görselinde tabak dikey merkezde; bardak tabağın üst yüzeyine oturur.
    this.placeGlassAt(L.glassCx)
    this.glassSteam.setZone(this.glass.worldRadiusAt(1) * 1.2)
    this.kettleSteam.setZone(14 * L.u)
    this.bubbles.setScale(L.u * 1.4)
    this.demlik.layout(L.pots.dem.rest, L.pots.dem.spout, L.potWidth.demlik)
    this.caydanlik.layout(L.pots.su.rest, L.pots.su.spout, L.potWidth.caydanlik)
    const bs = L.sugarBowl.size
    this.sugarBowl.setPosition(L.sugarBowl.x, L.sugarBowl.y - bs * 0.32).setDisplaySize(bs, bs)
    this.demPad.layout(L.controls.dem, u)
    this.suPad.layout(L.controls.su, u)
    this.serveBtn.layout(L.controls.serve, u)
  }

  destroy(): void {
    this.events.removeAllListeners()
    for (const o of [this.demlik, this.caydanlik, this.streamDem, this.streamSu, this.glass]) o.destroy()
    for (const o of [this.demPad, this.suPad, this.serveBtn]) o.destroy()
    this.glassSteam.destroy()
    this.kettleSteam.destroy()
    this.bubbles.destroy()
    this.saucer.destroy()
    this.puddle.destroy()
    this.spoon.destroy()
    this.sugarBowl.destroy()
    this.splash.destroy()
    for (const d of [...this.dropPool, ...this.cubePool]) d.destroy()
  }
}
