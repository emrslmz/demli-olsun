/**
 * Tezgâhın arkasında duran müşteri ve yanındaki konuşma balonu.
 * Balon iki modda: sipariş ve replik (servisten sonra müşterinin tepkisi).
 * Sipariş: küçük bir bardakta istenen renk ve doluluk, çayın adı, doluluk adı, şeker, renk çubuğu ve sabır çubuğu.
 * Renk çubuğu (açık → koyu): ▼ müşterinin istediği renk, ▲ bardaktaki çayın şu anki rengi. Rakam yok.
 *   numbers → ▼ + ▲, marks → yalnız ▼, none → çubuk yok (yalnız örnek bardak).
 */

import * as Phaser from 'phaser'
import { PATIENCE, type GaugeMode } from '@/config/gameplay'
import { FONTS } from '@/config/theme'
import type { Order } from '@/core/orders'
import { glassSkin } from '@/data/cosmetics'
import { customerImageId, type CustomerId, type Expression } from '@/data/customers'
import { rgbToInt, teaColor } from '@/core/teaColor'
import { FILL_TYPES, TEA_TYPES } from '@/data/orderTypes'
import type { Layout } from '../layout'
import { DEPTH } from './Background'
import { GlassView } from './GlassView'

const INK = 0x3b2416
const INK_CSS = '#3B2416'
/** Renk çubuğunun kapsadığı dem oranı aralığı (siparişlerin hepsi içinde kalır). */
const SCALE_D0 = 0.06
const SCALE_D1 = 0.86
const SCALE_STEPS = 28

/** Bardakta görünen çay rengi (cartoon opaklığıyla kremsi zemine karışmış). */
function swatch(d: number): number {
  const c = teaColor(d)
  const a = 0.45 + 0.55 * c.a
  const mix = (v: number) => Math.round(v * a + 250 * (1 - a))
  return rgbToInt({ r: mix(c.r), g: mix(c.g), b: mix(c.b) })
}

export class CustomerView {
  private readonly scene: Phaser.Scene
  readonly image: Phaser.GameObjects.Image
  readonly bubble: Phaser.GameObjects.Container
  /** Balon içeriği (sol üst köşe orijinli); dış kap balon merkezinden ölçeklenir. */
  private readonly inner: Phaser.GameObjects.Container
  private readonly bubbleBg: Phaser.GameObjects.Graphics
  private readonly bar: Phaser.GameObjects.Graphics
  /** Renk çubuğu (açık → koyu) ve işaretleri. */
  private readonly scale: Phaser.GameObjects.Graphics
  private guide: GaugeMode = 'numbers'
  private liveDem: number | null = null
  private scaleKey = ''
  private readonly mini: GlassView
  private readonly title: Phaser.GameObjects.Text
  private readonly sub: Phaser.GameObjects.Text
  private readonly line: Phaser.GameObjects.Text
  private readonly sugarText: Phaser.GameObjects.Text
  private readonly cubes: Phaser.GameObjects.Image[] = []
  private L!: Layout
  private who: CustomerId | null = null
  private order: Order | null = null
  private patience = 1
  private time = Math.random() * 10
  private shakeT = 0
  private present = false
  private mode: 'order' | 'line' = 'order'
  private reduced = false

  constructor(scene: Phaser.Scene, L: Layout, skinId = 'klasik') {
    this.scene = scene
    this.image = scene.add.image(0, 0, '__DEFAULT').setOrigin(0.5, 1).setDepth(DEPTH.customer).setVisible(false)
    this.bubbleBg = scene.add.graphics()
    this.bar = scene.add.graphics()
    this.scale = scene.add.graphics()
    this.mini = new GlassView(scene, 'ince', glassSkin(skinId))
    this.title = scene.add.text(0, 0, '', { fontFamily: FONTS.chalk, fontStyle: '800', fontSize: '40px', color: INK_CSS }).setOrigin(0, 0.5)
    this.sub = scene.add.text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '600', fontSize: '28px', color: '#7A5A44' }).setOrigin(0, 0.5)
    this.sugarText = scene.add
      .text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '700', fontSize: '26px', color: '#9A6A44' })
      .setOrigin(0, 0.5)
    this.line = scene.add
      .text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '700', fontSize: '30px', color: INK_CSS, align: 'center' })
      .setOrigin(0.5)
    for (let i = 0; i < 3; i++) this.cubes.push(scene.add.image(0, 0, 'prop_seker').setVisible(false))
    this.inner = scene.add.container(0, 0, [
      this.bubbleBg,
      this.mini.container,
      this.title,
      this.sub,
      this.sugarText,
      ...this.cubes,
      this.scale,
      this.bar,
      this.line,
    ])
    this.bubble = scene.add.container(0, 0, [this.inner])
    this.bubble.setDepth(45).setVisible(false)
    this.layout(L)
  }

  setReducedMotion(on: boolean): void {
    this.reduced = on
  }

  get isPresent(): boolean {
    return this.present
  }

  setExpression(expr: Expression): void {
    if (this.who) {
      const key = customerImageId(this.who, expr)
      if (this.scene.textures.exists(key)) this.image.setTexture(key)
    }
  }

  /** Yeni sipariş: müşteri soldan/sağdan yürüyerek gelir, sonra balon açılır. */
  async enter(order: Order, skinId?: string): Promise<void> {
    this.order = order
    this.who = order.customer
    this.patience = 1
    this.setExpression('neutral')
    if (skinId) this.mini.setType('ince', glassSkin(skinId))
    this.fillOrder(order)
    this.present = true
    const L = this.L
    const fromRight = order.id % 2 === 0
    this.image.setVisible(true).setAlpha(1)
    this.image.x = L.customer.cx + (fromRight ? 1 : -1) * L.customer.size
    await this.tweenTo(L.customer.cx, this.reduced ? 200 : 520, 'Cubic.easeOut', true)
    if (this.order !== order) return
    this.showBubble('order')
  }

  /** Müşteri gider (mutlu: bardağıyla sola, kızgın: sağa). */
  async leave(happy: boolean): Promise<void> {
    this.present = false
    this.hideBubble()
    const L = this.L
    await this.tweenTo(L.customer.cx + (happy ? -1 : 1) * L.customer.size, this.reduced ? 200 : 480, 'Cubic.easeIn', true)
    this.image.setVisible(false)
    this.order = null
  }

  private tweenTo(x: number, duration: number, ease: string, walk: boolean): Promise<void> {
    return new Promise((resolve) => {
      const state = { t: 0 }
      const x0 = this.image.x
      this.scene.tweens.add({
        targets: state,
        t: 1,
        duration,
        ease,
        onUpdate: () => {
          this.image.x = x0 + (x - x0) * state.t
          // Yürürken hafif zıplama
          if (walk && !this.reduced) this.image.y = this.L.customer.bottom - Math.abs(Math.sin(state.t * Math.PI * 4)) * 14 * this.L.u
        },
        onComplete: () => {
          this.image.y = this.L.customer.bottom
          resolve()
        },
      })
    })
  }

  // ---------- Balon ----------

  private fillOrder(o: Order): void {
    const L = this.L
    const u = L.u
    const b = L.bubble
    this.title.setText(TEA_TYPES[o.teaType].name).setFontSize(Math.round(46 * u))
    this.sub.setText(FILL_TYPES[o.fillType].name).setFontSize(Math.round(30 * u))
    const tx = 150 * u
    this.title.setPosition(tx, 52 * u)
    this.sub.setPosition(tx, 98 * u)
    // Şeker: küpler ya da "şekersiz"
    const cs = 40 * u
    const sy = 138 * u
    this.cubes.forEach((c, i) => {
      c.setVisible(i < o.sugar)
        .setDisplaySize(cs, cs)
        .setPosition(tx + cs * 0.5 + i * cs * 1.05, sy)
    })
    this.sugarText.setText(o.sugar === 0 ? 'şekersiz' : `${o.sugar} şeker`).setFontSize(Math.round(28 * u))
    this.sugarText.setPosition(o.sugar === 0 ? tx : tx + o.sugar * cs * 1.05 + 8 * u, sy)
    // Küçük bardak: istenen renk ve doluluk
    const unit = b.h * 0.46
    this.mini.place(78 * u, b.h * 0.84, unit)
    this.mini.reset()
    this.mini.setContents(o.fillTarget / 100, o.demTarget / 100, null)
    this.mini.update(1)
    this.scaleKey = ''
    this.drawScale()
  }

  /** Rehber modu ve bardaktaki çayın anlık dem oranı (boşsa null). Değişince renk çubuğu yeniden çizilir. */
  setGuide(mode: GaugeMode, liveDem: number | null): void {
    this.guide = mode
    this.liveDem = liveDem
    this.drawScale()
  }

  private scaleGeom(): { x: number; y: number; w: number; h: number } {
    const u = this.L.u
    const x = 150 * u
    return { x, y: 202 * u, w: this.L.bubble.w - x - 30 * u, h: 24 * u }
  }

  private drawScale(): void {
    const o = this.order
    const show = this.mode === 'order' && !!o && this.guide !== 'none'
    const live = show && this.guide === 'numbers' && this.liveDem !== null ? Math.round((this.liveDem as number) * 300) : -1
    const key = show && o ? `${o.id}|${this.guide}|${live}` : 'off'
    if (key === this.scaleKey) return
    this.scaleKey = key
    const g = this.scale
    g.clear()
    if (!show || !o) return
    const u = this.L.u
    const { x, y, w, h } = this.scaleGeom()
    const pos = (d: number) => x + ((Phaser.Math.Clamp(d, SCALE_D0, SCALE_D1) - SCALE_D0) / (SCALE_D1 - SCALE_D0)) * w
    // Çerçeve + açıktan koyuya renk dilimleri
    g.fillStyle(INK, 1).fillRoundedRect(x - 4 * u, y - 4 * u, w + 8 * u, h + 8 * u, 10 * u)
    const sw = w / SCALE_STEPS
    for (let i = 0; i < SCALE_STEPS; i++) {
      const d = SCALE_D0 + ((i + 0.5) / SCALE_STEPS) * (SCALE_D1 - SCALE_D0)
      g.fillStyle(swatch(d), 1).fillRect(x + i * sw, y, sw + 0.6, h)
    }
    g.fillStyle(0xffffff, 0.35).fillRect(x, y + 3 * u, w, h * 0.22)
    // ▼ hedef: müşterinin istediği renk
    const tx = pos(o.demTarget / 100)
    const m = 11 * u
    g.lineStyle(4 * u, INK, 1).lineBetween(tx, y - 2 * u, tx, y + h + 2 * u)
    g.fillStyle(INK, 1).fillTriangle(tx - m - 3 * u, y - m * 1.5 - 5 * u, tx + m + 3 * u, y - m * 1.5 - 5 * u, tx, y + 2 * u)
    g.fillStyle(swatch(o.demTarget / 100), 1).fillTriangle(
      tx - m + 2 * u,
      y - m * 1.5 - 1 * u,
      tx + m - 2 * u,
      y - m * 1.5 - 1 * u,
      tx,
      y - 4 * u,
    )
    // ▲ anlık: bardaktaki çayın rengi
    if (live >= 0) {
      const lx = pos(live / 300)
      const ly = y + h
      g.fillStyle(INK, 1).fillTriangle(lx - m - 3 * u, ly + m * 1.5 + 5 * u, lx + m + 3 * u, ly + m * 1.5 + 5 * u, lx, ly - 2 * u)
      g.fillStyle(0xffffff, 1).fillTriangle(lx - m + 2 * u, ly + m * 1.5 + 1 * u, lx + m - 2 * u, ly + m * 1.5 + 1 * u, lx, ly + 4 * u)
    }
  }

  private showBubble(mode: 'order' | 'line'): void {
    this.mode = mode
    const isOrder = mode === 'order'
    this.mini.container.setVisible(isOrder)
    this.title.setVisible(isOrder)
    this.sub.setVisible(isOrder)
    this.sugarText.setVisible(isOrder)
    this.bar.setVisible(isOrder)
    this.scale.setVisible(isOrder)
    if (!isOrder) this.cubes.forEach((c) => c.setVisible(false))
    else if (this.order) this.cubes.forEach((c, i) => c.setVisible(i < (this.order as Order).sugar))
    this.line.setVisible(!isOrder)
    this.drawBubble()
    this.bubble.setVisible(true).setScale(0.3).setAlpha(1)
    this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: this.reduced ? 80 : 280, ease: 'Back.easeOut' })
  }

  private hideBubble(): void {
    if (!this.bubble.visible) return
    this.scene.tweens.add({
      targets: this.bubble,
      scale: 0.6,
      alpha: 0,
      duration: 160,
      onComplete: () => this.bubble.setVisible(false).setAlpha(1).setScale(1),
    })
  }

  /** Servis sonrası replik (balonun içinde). */
  say(text: string, emoji: string, tone: 'good' | 'neutral' | 'bad', duration = 1700): void {
    const u = this.L.u
    this.line
      .setText(`${text} ${emoji}`)
      .setFontSize(Math.round(34 * u))
      .setWordWrapWidth(this.L.bubble.w - 50 * u)
      .setPosition(this.L.bubble.w / 2, this.L.bubble.h / 2)
    this.tone = tone
    this.showBubble('line')
    this.scene.time.delayedCall(duration, () => {
      if (this.mode === 'line') this.hideBubble()
    })
  }

  private tone: 'good' | 'neutral' | 'bad' = 'neutral'

  private drawBubble(): void {
    const L = this.L
    const u = L.u
    const b = L.bubble
    const g = this.bubbleBg
    g.clear()
    const r = 34 * u
    const fill = this.mode === 'line' ? (this.tone === 'bad' ? 0xffe6df : this.tone === 'good' ? 0xf0ffe6 : 0xfffdf6) : 0xfffdf6
    // Gölge
    g.fillStyle(0x2a1408, 0.22).fillRoundedRect(6 * u, 12 * u, b.w, b.h, r)
    // Kuyruk (müşterinin ağzına doğru)
    const tx = b.tailX - b.x
    const ty = b.tailY - b.y
    const baseX = b.w - 60 * u
    const baseY = b.h * 0.62
    g.fillStyle(INK, 1).fillTriangle(baseX - 26 * u, baseY - 20 * u, baseX + 10 * u, baseY + 30 * u, tx + 6 * u, ty + 4 * u)
    g.fillStyle(INK, 1).fillRoundedRect(-6 * u, -6 * u, b.w + 12 * u, b.h + 12 * u, r + 6 * u)
    g.fillStyle(fill, 1).fillRoundedRect(0, 0, b.w, b.h, r)
    g.fillStyle(fill, 1).fillTriangle(baseX - 18 * u, baseY - 16 * u, baseX + 4 * u, baseY + 20 * u, tx - 4 * u, ty - 6 * u)
    // Üst parlama
    g.fillStyle(0xffffff, 0.8).fillRoundedRect(16 * u, 12 * u, b.w * 0.5, 10 * u, 5 * u)
    this.drawBar()
    this.scaleKey = ''
    this.drawScale()
  }

  private drawBar(): void {
    if (this.mode !== 'order') return
    const L = this.L
    const u = L.u
    const b = L.bubble
    const g = this.bar
    g.clear()
    const x = 150 * u
    const w = b.w - x - 30 * u
    const y = b.h - 46 * u
    const h = 18 * u
    const p = Phaser.Math.Clamp(this.patience, 0, 1)
    const col = p > 0.5 ? 0x5cb85c : p > PATIENCE.warnBelow ? 0xf2b234 : 0xe5533c
    g.fillStyle(INK, 1).fillRoundedRect(x - 3 * u, y - 3 * u, w + 6 * u, h + 6 * u, h / 2 + 3 * u)
    g.fillStyle(0xe9dcc6, 1).fillRoundedRect(x, y, w, h, h / 2)
    if (p > 0.01) g.fillStyle(col, 1).fillRoundedRect(x, y, Math.max(h, w * p), h, h / 2)
    g.fillStyle(0xffffff, 0.45).fillRoundedRect(x + 4 * u, y + 3 * u, Math.max(0, w * p - 8 * u), h * 0.3, h * 0.15)
  }

  setPatience(ratio: number): void {
    const was = this.patience
    this.patience = ratio
    if (Math.abs(was - ratio) > 0.004) this.drawBar()
    if (ratio < PATIENCE.warnBelow && was >= PATIENCE.warnBelow) this.shakeT = 0.6
  }

  update(dt: number): void {
    this.time += dt
    if (!this.image.visible) return
    // Nefes alma: çok hafif ölçek
    if (!this.reduced) {
      const s = 1 + Math.sin(this.time * 2.2) * 0.006
      const base = this.L.customer.size / Math.max(1, this.image.width)
      this.image.setScale(base, base * s)
    }
    // Sabırsızlık: balon titrer
    if (this.bubble.visible) {
      let ox = 0
      if (this.shakeT > 0) {
        this.shakeT -= dt
        ox = Math.sin(this.time * 60) * 8 * this.L.u * (this.reduced ? 0 : 1)
      } else if (this.mode === 'order' && this.patience < PATIENCE.warnBelow && !this.reduced) {
        ox = Math.sin(this.time * 30) * 2.5 * this.L.u
      }
      this.bubble.x = this.L.bubble.x + this.L.bubble.w / 2 + ox
    }
  }

  /** Bardağın servis edileceği nokta (müşterinin önü). */
  servePoint(): { x: number; y: number } {
    return { x: this.L.customer.cx, y: this.L.counterY + 30 * this.L.u }
  }

  layout(L: Layout): void {
    this.L = L
    const size = L.customer.size
    if (this.image.width > 1) this.image.setScale(size / this.image.width)
    else this.image.setDisplaySize(size, size)
    this.image.setPosition(this.present ? L.customer.cx : this.image.x, L.customer.bottom)
    this.bubble.setPosition(L.bubble.x + L.bubble.w / 2, L.bubble.y + L.bubble.h / 2)
    this.inner.setPosition(-L.bubble.w / 2, -L.bubble.h / 2)
    if (this.order) this.fillOrder(this.order)
    if (this.bubble.visible) this.drawBubble()
  }

  destroy(): void {
    this.mini.destroy()
    this.bubble.destroy(true)
    this.image.destroy()
  }
}
