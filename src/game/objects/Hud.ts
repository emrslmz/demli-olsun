/** Oyun içi HUD: duraklat, puan (sayarak), kombo, canlar (bardak ikonları), bahşiş sayacı. Phaser çizer. */

import * as Phaser from 'phaser'
import { FONTS } from '@/config/theme'
import { num } from '@/i18n/tr'
import type { Layout } from '../layout'

const DARK = 0x3b2416

function style(size: number, color = '#FFF6E6'): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONTS.ui,
    fontStyle: '900',
    fontSize: `${Math.round(size)}px`,
    color,
    stroke: '#3B2416',
    strokeThickness: Math.max(3, Math.round(size * 0.2)),
  }
}

export class Hud {
  private readonly scene: Phaser.Scene
  private readonly pauseBg: Phaser.GameObjects.Graphics
  private readonly pauseIcon: Phaser.GameObjects.Image
  private readonly pauseZone: Phaser.GameObjects.Zone
  private readonly scoreLabel: Phaser.GameObjects.Text
  private readonly scoreText: Phaser.GameObjects.Text
  private readonly comboText: Phaser.GameObjects.Text
  private readonly coin: Phaser.GameObjects.Image
  private readonly tipsText: Phaser.GameObjects.Text
  private readonly lives: Phaser.GameObjects.Image[] = []
  private L!: Layout
  private score = 0
  private shownScore = 0
  private tips = 0
  private shownTips = 0
  private livesCount = 3
  private maxLives = 3
  onPause: (() => void) | null = null

  constructor(scene: Phaser.Scene, L: Layout) {
    this.scene = scene
    this.pauseBg = scene.add.graphics().setDepth(60)
    this.pauseIcon = scene.add.image(0, 0, 'icon_pause').setDepth(61)
    this.pauseZone = scene.add.zone(0, 0, 10, 10).setOrigin(0.5).setInteractive().setDepth(62)
    this.pauseZone.on(Phaser.Input.Events.POINTER_DOWN, () => this.onPause?.())
    this.scoreLabel = scene.add.text(0, 0, 'Puan', style(20)).setOrigin(0, 1).setDepth(60)
    this.scoreText = scene.add.text(0, 0, '0', style(40)).setOrigin(0, 0.5).setDepth(60)
    this.comboText = scene.add.text(0, 0, '', style(30, '#F6C445')).setOrigin(0, 0.5).setDepth(60)
    this.coin = scene.add.image(0, 0, 'icon_coin').setDepth(60)
    this.tipsText = scene.add.text(0, 0, '0', style(34)).setOrigin(1, 0.5).setDepth(60)
    this.layout(L)
  }

  layout(L: Layout): void {
    this.L = L
    const { x, y, w, h } = L.hud
    const u = L.u
    const cy = y + h / 2
    const pr = h * 0.42
    this.pauseBg.clear()
    this.pauseBg.fillStyle(DARK, 1).fillCircle(x + pr, cy + 4 * u, pr + 3 * u)
    this.pauseBg.fillStyle(0x1e2b24, 1).fillCircle(x + pr, cy, pr)
    this.pauseBg.lineStyle(4 * u, 0xfff6e6, 0.35).strokeCircle(x + pr, cy, pr - 6 * u)
    this.pauseIcon.setPosition(x + pr, cy).setDisplaySize(pr * 1.05, pr * 1.05)
    this.pauseZone.setPosition(x + pr, cy).setSize(pr * 2.6, pr * 2.6)
    this.pauseZone.input?.hitArea.setTo(0, 0, pr * 2.6, pr * 2.6)
    const sx = x + pr * 2 + 18 * u
    this.scoreLabel.setStyle(style(22 * u)).setPosition(sx, cy - 6 * u)
    this.scoreText.setStyle(style(46 * u)).setPosition(sx, cy + 16 * u)
    this.comboText.setStyle(style(34 * u, '#F6C445'))
    this.placeCombo()
    // Canlar: ortada
    const lifeSize = h * 0.62
    const lx = x + w * 0.6
    this.lives.forEach((img, i) => img.setPosition(lx + (i - (this.lives.length - 1) / 2) * lifeSize * 0.82, cy).setDisplaySize(lifeSize, lifeSize))
    // Bahşiş: sağda
    const cs = h * 0.52
    this.tipsText.setStyle(style(38 * u)).setPosition(x + w - 4 * u, cy)
    this.coin.setDisplaySize(cs, cs)
    this.placeCoin()
  }

  private placeCoin(): void {
    const cs = this.coin.displayWidth
    this.coin.setPosition(this.tipsText.x - this.tipsText.width - cs * 0.6, this.tipsText.y)
  }

  private placeCombo(): void {
    this.comboText.setPosition(this.scoreText.x + this.scoreText.width + 14 * this.L.u, this.scoreText.y)
  }

  /** HUD'daki bahşiş ikonunun konumu (para uçuşu hedefi). */
  coinTarget(): { x: number; y: number } {
    return { x: this.coin.x, y: this.coin.y }
  }

  scoreTarget(): { x: number; y: number } {
    return { x: this.scoreText.x + this.scoreText.width / 2, y: this.scoreText.y }
  }

  setLives(n: number, max: number, animateLoss = false): void {
    if (max !== this.maxLives || this.lives.length !== max) {
      for (const l of this.lives) l.destroy()
      this.lives.length = 0
      for (let i = 0; i < max; i++) this.lives.push(this.scene.add.image(0, 0, 'icon_life').setDepth(60))
      this.maxLives = max
      this.layout(this.L)
    }
    const prev = this.livesCount
    this.livesCount = n
    this.lives.forEach((img, i) => {
      const alive = i < n
      if (!alive && i < prev && animateLoss) {
        // Bardak ikonu çatlar ve söner.
        img.setTexture('icon_life_broken')
        this.scene.tweens.add({ targets: img, angle: { from: -14, to: 14 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => img.setAngle(0) })
        this.scene.tweens.add({ targets: img, alpha: 0.28, duration: 500, delay: 320 })
      } else {
        img.setTexture(alive ? 'icon_life' : 'icon_life_broken').setAlpha(alive ? 1 : 0.28)
        if (alive && i >= prev) {
          img.setScale(img.scaleX * 1.4)
          this.scene.tweens.add({ targets: img, scale: img.scaleX / 1.4, duration: 300, ease: 'Back.easeOut' })
        }
      }
    })
  }

  setScore(score: number): void {
    this.score = score
  }

  setTips(tips: number): void {
    this.tips = tips
  }

  bumpCoin(): void {
    this.scene.tweens.add({ targets: this.coin, scale: { from: this.coin.scale * 1.25, to: this.coin.scale }, duration: 200, ease: 'Back.easeOut' })
  }

  setCombo(mult: number): void {
    const text = mult > 1.001 ? `×${mult.toFixed(1).replace('.', ',')}` : ''
    if (text === this.comboText.text) return
    this.comboText.setText(text)
    this.placeCombo()
    if (text) {
      this.comboText.setScale(1.6)
      this.scene.tweens.add({ targets: this.comboText, scale: 1, duration: 320, ease: 'Back.easeOut' })
    }
  }

  update(dt: number): void {
    if (this.shownScore !== this.score) {
      const diff = this.score - this.shownScore
      const step = Math.max(1, Math.ceil(Math.abs(diff) * Math.min(1, dt * 6)))
      this.shownScore += Math.sign(diff) * Math.min(Math.abs(diff), step)
      this.scoreText.setText(num(this.shownScore))
      this.placeCombo()
    }
    if (this.shownTips !== this.tips) {
      const diff = this.tips - this.shownTips
      this.shownTips += Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * Math.min(1, dt * 5)))
      if (Math.sign(this.tips - this.shownTips) !== Math.sign(diff)) this.shownTips = this.tips
      this.tipsText.setText(num(this.shownTips))
      this.placeCoin()
    }
  }

  setVisible(v: boolean): void {
    for (const o of [this.pauseBg, this.pauseIcon, this.scoreLabel, this.scoreText, this.comboText, this.coin, this.tipsText, ...this.lives]) o.setVisible(v)
    if (v) this.pauseZone.setInteractive()
    else this.pauseZone.disableInteractive()
  }

  destroy(): void {
    for (const o of [this.pauseBg, this.pauseIcon, this.pauseZone, this.scoreLabel, this.scoreText, this.comboText, this.coin, this.tipsText, ...this.lives]) o.destroy()
  }
}
