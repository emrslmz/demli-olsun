/**
 * Sipariş tablosu: tebeşir yazılı kara tahta + tahtaya iğnelenmiş kâğıt fişler.
 * Fişler sırayla işlenir (FIFO); ilk fiş aktiftir ve vurgulanır.
 */

import * as Phaser from 'phaser'
import { PATIENCE } from '@/config/gameplay'
import { FONTS } from '@/config/theme'
import type { Order } from '@/core/orders'
import { CUSTOMERS, customerImageId, type Expression } from '@/data/customers'
import { GLASS_DEFS } from '@/core/glassModel'
import { TEA_TYPES } from '@/data/orderTypes'
import { tr } from '@/i18n/tr'
import { ThemeService } from '@/services/theme/ThemeService'
import type { Layout } from '../layout'

const INK = '#3B2416'
const RED = '#8B1E0F'

export class OrderCard {
  readonly container: Phaser.GameObjects.Container
  readonly order: Order
  private readonly scene: Phaser.Scene
  private readonly paper: Phaser.GameObjects.Image
  private readonly glow: Phaser.GameObjects.Image
  readonly portrait: Phaser.GameObjects.Image
  private readonly nameText: Phaser.GameObjects.Text
  private readonly teaText: Phaser.GameObjects.Text
  private readonly glassText: Phaser.GameObjects.Text
  private readonly demText: Phaser.GameObjects.Text
  private readonly fillText: Phaser.GameObjects.Text
  private readonly sugarIcons: Phaser.GameObjects.Image[] = []
  private readonly trayText: Phaser.GameObjects.Text
  private readonly trayDots: Phaser.GameObjects.Arc[] = []
  private readonly barBg: Phaser.GameObjects.Graphics
  private readonly bar: Phaser.GameObjects.Rectangle
  private readonly xMark: Phaser.GameObjects.Graphics
  private readonly corner: Phaser.GameObjects.Image | null
  private cw = 200
  private ch = 250
  private revealT = 1
  private ratio = 1
  private warn = false
  private shakeTween: Phaser.Tweens.Tween | null = null
  active = false
  expression: Expression = 'neutral'

  constructor(scene: Phaser.Scene, order: Order) {
    this.scene = scene
    this.order = order
    this.container = scene.add.container(0, 0).setDepth(50)
    this.glow = scene.add.image(0, 0, 'ca_glow').setTint(0xffd27a).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD)
    this.paper = scene.add.image(0, 0, 'ui_card')
    this.portrait = scene.add.image(0, 0, customerImageId(order.customer, 'neutral'))
    const chalk = (size: number, color = INK, extra: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) =>
      scene.add.text(0, 0, '', { fontFamily: FONTS.chalk, fontStyle: '700', fontSize: `${size}px`, color, ...extra })
    this.nameText = chalk(20).setOrigin(0.5, 0)
    this.teaText = chalk(24, INK, { align: 'center' }).setOrigin(0.5, 0)
    this.glassText = scene.add.text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '16px', color: '#8A5A33' }).setOrigin(0.5, 0)
    this.demText = chalk(28).setOrigin(0, 0.5)
    this.fillText = chalk(28).setOrigin(0, 0.5)
    for (let i = 0; i < order.sugar; i++) this.sugarIcons.push(scene.add.image(0, 0, 'icon_sugar').setAlpha(0.35))
    this.trayText = chalk(22, RED).setOrigin(1, 0.5)
    for (let i = 0; order.trayCount > 1 && i < order.trayCount; i++) this.trayDots.push(scene.add.circle(0, 0, 5, 0xd9c7a2).setStrokeStyle(2, 0x3b2416))
    this.barBg = scene.add.graphics()
    this.bar = scene.add.rectangle(0, 0, 10, 10, 0x4e9a3a).setOrigin(0, 0.5)
    this.xMark = scene.add.graphics().setAlpha(0)
    const cornerId = ThemeService.extras().deco.includes('deco_card_corner') ? 'deco_card_corner' : null
    this.corner = cornerId && scene.textures.exists(cornerId) ? scene.add.image(0, 0, cornerId) : null
    this.container.add([
      this.glow,
      this.paper,
      this.portrait,
      this.nameText,
      this.teaText,
      this.glassText,
      this.demText,
      this.fillText,
      ...this.sugarIcons,
      this.trayText,
      ...this.trayDots,
      this.barBg,
      this.bar,
      ...(this.corner ? [this.corner] : []),
      this.xMark,
    ])
    const def = CUSTOMERS[order.customer]
    this.nameText.setText(def.short)
    this.teaText.setText(TEA_TYPES[order.teaType].name)
    this.glassText.setText(order.glass === 'ince' ? '' : GLASS_DEFS[order.glass].name)
    this.demText.setText(`Dem %${order.demTarget}`)
    this.fillText.setText(`Dolu %${order.fillTarget}`)
    this.trayText.setText(order.trayCount > 1 ? `×${order.trayCount}` : '')
  }

  /** Kart boyutu; içerik orantılı yerleşir. */
  setSize(cw: number, ch: number): void {
    this.cw = cw
    this.ch = ch
    const left = -cw / 2
    const top = -ch / 2
    this.paper.setDisplaySize(cw, ch)
    this.glow.setDisplaySize(cw * 1.5, ch * 1.35)
    const p = cw * 0.46
    this.portrait.setDisplaySize(p, p).setPosition(left + cw * 0.08 + p / 2, top + ch * 0.12 + p / 2)
    this.nameText.setFontSize(Math.round(cw * 0.085)).setPosition(this.portrait.x, top + ch * 0.12 + p - cw * 0.02)
    const rc = left + cw * 0.76
    this.teaText.setFontSize(Math.round(cw * 0.115)).setWordWrapWidth(cw * 0.44).setPosition(rc, top + ch * 0.14)
    this.teaText.setLineSpacing(-cw * 0.02)
    this.glassText.setFontSize(Math.round(cw * 0.068)).setPosition(rc, this.teaText.y + this.teaText.height + ch * 0.01)
    this.demText.setFontSize(Math.round(cw * 0.15)).setPosition(left + cw * 0.1, top + ch * 0.6)
    this.fillText.setFontSize(Math.round(cw * 0.15)).setPosition(left + cw * 0.1, top + ch * 0.73)
    const ss = cw * 0.12
    this.sugarIcons.forEach((s, i) => s.setDisplaySize(ss, ss).setPosition(left + cw * 0.17 + i * ss * 1.05, top + ch * 0.835))
    this.trayText.setFontSize(Math.round(cw * 0.1)).setPosition(left + cw * 0.9, top + ch * 0.835)
    this.trayDots.forEach((d, i) => d.setRadius(cw * 0.022).setPosition(left + cw * 0.5 + i * cw * 0.065, top + ch * 0.835))
    const bx = left + cw * 0.11
    const bw = cw * 0.78
    const by = top + ch * 0.915
    const bh = Math.max(4, ch * 0.035)
    this.barBg.clear()
    this.barBg.fillStyle(0x3b2416, 0.85).fillRoundedRect(bx - 2, by - bh / 2 - 2, bw + 4, bh + 4, bh / 2 + 2)
    this.barBg.fillStyle(0xd9c7a2, 1).fillRoundedRect(bx, by - bh / 2, bw, bh, bh / 2)
    this.bar.setPosition(bx, by).setSize(bw * this.ratio, bh)
    this.bar.setData('w', bw)
    if (this.corner) this.corner.setDisplaySize(cw * 0.3, cw * 0.3).setPosition(left + cw * 0.86, top + ch * 0.1).setAngle(12)
    this.xMark.clear()
    this.xMark.lineStyle(cw * 0.06, 0xc0392b, 1)
    this.xMark.lineBetween(-cw * 0.3, -ch * 0.25, cw * 0.3, ch * 0.25)
    this.xMark.lineBetween(cw * 0.3, -ch * 0.25, -cw * 0.3, ch * 0.25)
    this.applyReveal()
  }

  get width(): number {
    return this.cw
  }

  get height(): number {
    return this.ch
  }

  setPatience(ratio: number): void {
    this.ratio = Math.max(0, Math.min(1, ratio))
    const w = (this.bar.getData('w') as number) ?? 0
    this.bar.width = Math.max(0.001, w * this.ratio)
    this.bar.setFillStyle(this.ratio > 0.5 ? 0x4e9a3a : this.ratio > PATIENCE.warnBelow ? 0xe2b33c : 0xc0392b)
    const warn = this.ratio < PATIENCE.warnBelow && this.ratio > 0
    if (warn !== this.warn) {
      this.warn = warn
      if (warn) {
        this.portrait.setTint(0xff9a8a)
        this.shakeTween = this.scene.tweens.add({ targets: this.paper, x: { from: -3, to: 3 }, duration: 70, yoyo: true, repeat: -1 })
      } else {
        this.portrait.clearTint()
        this.shakeTween?.stop()
        this.paper.x = 0
      }
    }
  }

  setActive(on: boolean, reduced = false): void {
    if (this.active === on) return
    this.active = on
    this.scene.tweens.add({ targets: this.container, scale: on ? 1.05 : 1, duration: reduced ? 1 : 220, ease: 'Back.easeOut' })
    this.scene.tweens.add({ targets: this.glow, alpha: on ? 0.55 : 0, duration: 220 })
    this.container.setAlpha(on ? 1 : 0.9)
  }

  setExpression(e: Expression): void {
    this.expression = e
    this.portrait.setTexture(customerImageId(this.order.customer, e))
    this.scene.tweens.add({ targets: this.portrait, scale: { from: this.portrait.scale * 1.15, to: this.portrait.scale }, duration: 260, ease: 'Back.easeOut' })
  }

  setSugarGiven(n: number): void {
    this.sugarIcons.forEach((s, i) => s.setAlpha(i < n ? 1 : 0.35))
  }

  setTrayServed(n: number): void {
    this.trayDots.forEach((d, i) => d.setFillStyle(i < n ? 0x4e9a3a : 0xd9c7a2))
  }

  showX(): void {
    this.xMark.setAlpha(1).setScale(1.6)
    this.scene.tweens.add({ targets: this.xMark, scale: 1, duration: 260, ease: 'Back.easeOut' })
  }

  /** Tebeşirle yazılıyormuş gibi: metinler soldan sağa açılır. */
  reveal(duration = 450): void {
    this.revealT = 0
    this.applyReveal()
    const state = { t: 0 }
    this.scene.tweens.add({
      targets: state,
      t: 1,
      duration,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        this.revealT = state.t
        this.applyReveal()
      },
    })
  }

  private applyReveal(): void {
    for (const t of [this.nameText, this.teaText, this.glassText, this.demText, this.fillText, this.trayText]) {
      if (this.revealT >= 1) t.setCrop()
      else t.setCrop(0, 0, t.width * this.revealT, t.height)
    }
    this.sugarIcons.forEach((s) => s.setVisible(this.revealT > 0.7))
  }

  destroy(): void {
    this.shakeTween?.stop()
    this.container.destroy(true)
  }
}

export class OrderBoard {
  private readonly scene: Phaser.Scene
  private board: Phaser.GameObjects.NineSlice
  private readonly title: Phaser.GameObjects.Text
  private deco: Phaser.GameObjects.Image | null = null
  private readonly rushBanner: Phaser.GameObjects.Container
  private readonly rushText: Phaser.GameObjects.Text
  private readonly rushBar: Phaser.GameObjects.Rectangle
  readonly cards: OrderCard[] = []
  private L!: Layout
  private slotW = 200
  private slotH = 250
  private reduced = false

  constructor(scene: Phaser.Scene, L: Layout) {
    this.scene = scene
    const meta = ThemeService.meta('ui_board')
    const tex = scene.textures.get('ui_board').getSourceImage() as { width: number; height: number }
    const sl = meta?.slice ?? [0.06, 0.06, 0.08, 0.08]
    this.board = scene.add.nineslice(0, 0, 'ui_board', undefined, 400, 200, sl[0] * tex.width, sl[1] * tex.width, sl[2] * tex.height, sl[3] * tex.height).setDepth(45)
    this.title = scene.add
      .text(0, 0, tr.game.orders, { fontFamily: FONTS.chalk, fontStyle: '700', fontSize: '28px', color: '#EDEDE4' })
      .setDepth(46)
      .setAlpha(0.85)
    if (ThemeService.extras().deco.includes('deco_board_top') && scene.textures.exists('deco_board_top')) {
      this.deco = scene.add.image(0, 0, 'deco_board_top').setDepth(47)
    }
    this.rushText = scene.add
      .text(0, 0, '', { fontFamily: FONTS.chalk, fontStyle: '700', fontSize: '30px', color: '#FFF6E6', stroke: '#8B1E0F', strokeThickness: 6 })
      .setOrigin(0.5)
    this.rushBar = scene.add.rectangle(0, 0, 10, 6, 0xf6c445).setOrigin(0, 0.5)
    const ribbon = scene.add.graphics()
    this.rushBanner = scene.add.container(0, 0, [ribbon, this.rushText, this.rushBar]).setDepth(70).setVisible(false)
    this.rushBanner.setData('ribbon', ribbon)
    this.layout(L)
  }

  setReducedMotion(r: boolean): void {
    this.reduced = r
  }

  layout(L: Layout): void {
    this.L = L
    const u = L.u
    const b = L.board
    // NineSlice'ı kendi boyutunda oluşturup ölçekleyerek çerçeve kalınlığını u ile orantılı tut.
    const k = u * 0.62
    this.board.setPosition(b.x + b.w / 2, b.y + b.h / 2)
    this.board.setSize(b.w / k, b.h / k)
    this.board.setScale(k)
    this.title.setFontSize(Math.round(30 * u)).setPosition(b.x + 40 * u, b.y + 24 * u)
    if (this.deco) {
      const tex = this.deco.texture.getSourceImage() as { width: number; height: number }
      const dh = 120 * u
      this.deco.setPosition(b.x + b.w / 2, b.y + 6 * u).setDisplaySize(b.w + 30 * u, dh * (tex.height / 256))
      this.deco.setOrigin(0.5, 0.42)
    }
    const padX = 30 * u
    const top = b.y + 50 * u
    const availH = b.h - 50 * u - 22 * u
    const n = L.cardSlots
    const gap = 16 * u
    const maxW = (b.w - padX * 2 - gap * (n - 1)) / n
    this.slotH = Math.min(availH, maxW / 0.8)
    this.slotW = this.slotH * 0.8
    const used = this.slotW * n + gap * (n - 1)
    const startX = b.x + (b.w - used) / 2 + this.slotW / 2
    this.slotX = (i: number) => startX + i * (this.slotW + gap)
    this.slotY = top + this.slotH / 2
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i] as OrderCard
      c.setSize(this.slotW, this.slotH)
      c.container.setPosition(this.slotX(i), this.slotY)
    }
    // Yoğun saat şeridi
    const ribbon = this.rushBanner.getData('ribbon') as Phaser.GameObjects.Graphics
    const rw = b.w * 0.62
    const rh = 64 * u
    ribbon.clear()
    ribbon.fillStyle(0x3b2416, 1).fillRoundedRect(-rw / 2 - 4 * u, -rh / 2 - 4 * u + 6 * u, rw + 8 * u, rh + 8 * u, 14 * u)
    ribbon.fillStyle(0xc0392b, 1).fillRoundedRect(-rw / 2, -rh / 2, rw, rh, 12 * u)
    ribbon.fillStyle(0xffffff, 0.15).fillRoundedRect(-rw / 2 + 6 * u, -rh / 2 + 5 * u, rw - 12 * u, rh * 0.35, 10 * u)
    this.rushBanner.setPosition(b.x + b.w / 2, b.y + b.h - 4 * u)
    this.rushText.setFontSize(Math.round(36 * u)).setStroke('#8B1E0F', 6 * u).setPosition(0, -6 * u)
    this.rushBar.setPosition(-rw / 2 + 14 * u, rh / 2 - 9 * u).setSize(rw - 28 * u, 7 * u)
    this.rushBar.setData('w', rw - 28 * u)
  }

  private slotX: (i: number) => number = () => 0
  private slotY = 0

  /** Kapasite (tablo genişliğine göre en fazla 4). */
  get capacity(): number {
    return this.L.cardSlots
  }

  addCard(order: Order): OrderCard {
    const card = new OrderCard(this.scene, order)
    const i = this.cards.length
    this.cards.push(card)
    card.setSize(this.slotW, this.slotH)
    const x = this.slotX(i)
    card.container.setPosition(x, this.slotY - 90 * this.L.u).setAlpha(0).setAngle(-8)
    this.scene.tweens.add({
      targets: card.container,
      y: this.slotY,
      alpha: 1,
      angle: 0,
      duration: this.reduced ? 1 : 360,
      ease: 'Back.easeOut',
      onComplete: () => card.reveal(this.reduced ? 1 : 450),
    })
    return card
  }

  /** Fişi kaldırır, kalanları sola kaydırır. ok: sonuç olumluysa yukarı uçar, değilse düşer. */
  removeCard(card: OrderCard, ok: boolean): void {
    const i = this.cards.indexOf(card)
    if (i < 0) return
    this.cards.splice(i, 1)
    this.scene.tweens.add({
      targets: card.container,
      y: card.container.y + (ok ? -120 : 160) * this.L.u,
      alpha: 0,
      angle: ok ? 0 : 18,
      duration: this.reduced ? 1 : 380,
      ease: ok ? 'Back.easeIn' : 'Quad.easeIn',
      onComplete: () => card.destroy(),
    })
    this.cards.forEach((c, j) => {
      this.scene.tweens.add({ targets: c.container, x: this.slotX(j), duration: this.reduced ? 1 : 320, ease: 'Cubic.easeOut', delay: 120 })
    })
  }

  cardWorldBottom(card: OrderCard): { x: number; y: number } {
    return { x: card.container.x, y: card.container.y + this.slotH / 2 }
  }

  showRush(name: string): void {
    this.rushText.setText(`${tr.hud.rush} ${name}`)
    this.rushBanner.setVisible(true).setScale(0.3).setAlpha(0)
    this.scene.tweens.add({ targets: this.rushBanner, scale: 1, alpha: 1, duration: 360, ease: 'Back.easeOut' })
  }

  setRushProgress(ratio: number): void {
    const w = (this.rushBar.getData('w') as number) ?? 0
    this.rushBar.width = Math.max(0.001, w * Math.max(0, Math.min(1, ratio)))
  }

  hideRush(): void {
    this.scene.tweens.add({ targets: this.rushBanner, scale: 0.6, alpha: 0, duration: 260, onComplete: () => this.rushBanner.setVisible(false) })
  }

  shake(): void {
    if (this.reduced) return
    this.scene.tweens.add({ targets: this.board, x: { from: this.board.x - 6 * this.L.u, to: this.board.x }, duration: 60, yoyo: true, repeat: 2 })
  }

  destroy(): void {
    for (const c of this.cards) c.destroy()
    this.cards.length = 0
    this.board.destroy()
    this.title.destroy()
    this.deco?.destroy()
    this.rushBanner.destroy(true)
  }
}
