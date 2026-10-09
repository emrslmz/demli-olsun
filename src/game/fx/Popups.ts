/** Konuşma balonu, uçan puan yazıları, yıldız patlaması. Havuzlu; oyun döngüsünde yeni nesne üretmez. */

import * as Phaser from 'phaser'
import { FONTS } from '@/config/theme'

export class SpeechBubble {
  private readonly scene: Phaser.Scene
  readonly container: Phaser.GameObjects.Container
  private readonly bg: Phaser.GameObjects.Graphics
  private readonly text: Phaser.GameObjects.Text
  private hideTimer: Phaser.Time.TimerEvent | null = null
  private u = 1

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.bg = scene.add.graphics()
    this.text = scene.add
      .text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '800', fontSize: '28px', color: '#3B2416', align: 'center' })
      .setOrigin(0.5)
    this.container = scene.add.container(0, 0, [this.bg, this.text]).setDepth(80).setVisible(false)
  }

  setUnit(u: number): void {
    this.u = u
  }

  /** (x, y): balonun ucu (kartın altı). maxW: en geniş. */
  show(x: number, y: number, line: string, emoji: string, maxW: number, duration = 1700, tone: 'good' | 'bad' | 'neutral' = 'neutral'): void {
    const u = this.u
    this.hideTimer?.remove()
    this.text.setFontSize(Math.round(30 * u)).setWordWrapWidth(maxW - 40 * u).setText(`${line} ${emoji}`)
    const w = Math.min(maxW, this.text.width + 44 * u)
    const h = this.text.height + 30 * u
    const tail = 22 * u
    // Ucu kart tarafında kalsın, balon ekrana sığsın
    const cam = this.scene.cameras.main
    let bx = Phaser.Math.Clamp(x, w / 2 + 10 * u, cam.width - w / 2 - 10 * u)
    const by = y + tail + h / 2
    const g = this.bg
    g.clear()
    const fill = tone === 'bad' ? 0xffe3dc : tone === 'good' ? 0xf3ffe8 : 0xfffaf0
    g.fillStyle(0x3b2416, 1).fillRoundedRect(-w / 2 - 4 * u, -h / 2 - 4 * u + 5 * u, w + 8 * u, h + 8 * u, 22 * u)
    g.fillStyle(0x3b2416, 1).fillRoundedRect(-w / 2 - 4 * u, -h / 2 - 4 * u, w + 8 * u, h + 8 * u, 22 * u)
    g.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 18 * u)
    const tx = Phaser.Math.Clamp(x - bx, -w / 2 + 30 * u, w / 2 - 30 * u)
    g.fillStyle(0x3b2416, 1).fillTriangle(tx - 18 * u, -h / 2 + 2, tx + 18 * u, -h / 2 + 2, tx, -h / 2 - tail - 4 * u)
    g.fillStyle(fill, 1).fillTriangle(tx - 12 * u, -h / 2 + 3, tx + 12 * u, -h / 2 + 3, tx, -h / 2 - tail + 4 * u)
    this.text.setPosition(0, 0)
    bx = Math.round(bx)
    this.container.setPosition(bx, by).setVisible(true).setScale(0.2).setAlpha(1)
    this.scene.tweens.add({ targets: this.container, scale: 1, duration: 260, ease: 'Back.easeOut' })
    this.hideTimer = this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({ targets: this.container, scale: 0.8, alpha: 0, duration: 200, onComplete: () => this.container.setVisible(false) })
    })
  }

  destroy(): void {
    this.hideTimer?.remove()
    this.container.destroy(true)
  }
}

export class FloatTexts {
  private readonly scene: Phaser.Scene
  private readonly pool: Phaser.GameObjects.Text[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  private get(): Phaser.GameObjects.Text {
    let t = this.pool.find((x) => !x.active)
    if (!t) {
      t = this.scene.add
        .text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '900', fontSize: '40px', color: '#FFF6E6', stroke: '#3B2416', strokeThickness: 8 })
        .setOrigin(0.5)
        .setDepth(90)
      this.pool.push(t)
    }
    return t.setActive(true).setVisible(true).setAlpha(1).setScale(1)
  }

  /** Yukarı süzülüp söner. */
  float(x: number, y: number, text: string, size: number, color = '#FFF6E6', rise = 80, duration = 900): void {
    const t = this.get().setText(text).setFontSize(Math.round(size)).setColor(color).setStroke('#3B2416', Math.max(4, size * 0.18))
    t.setPosition(x, y).setScale(0.4)
    this.scene.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' })
    this.scene.tweens.add({
      targets: t,
      y: y - rise,
      alpha: 0,
      delay: duration * 0.45,
      duration: duration * 0.55,
      ease: 'Sine.easeIn',
      onComplete: () => t.setActive(false).setVisible(false),
    })
  }

  /** Bir hedefe uçar (bardaktan HUD'a puan). */
  fly(x: number, y: number, text: string, size: number, to: { x: number; y: number }, onArrive?: () => void, color = '#FFF6E6'): void {
    const t = this.get().setText(text).setFontSize(Math.round(size)).setColor(color).setStroke('#3B2416', Math.max(4, size * 0.18))
    t.setPosition(x, y).setScale(0.5)
    this.scene.tweens.add({ targets: t, scale: 1.15, duration: 240, ease: 'Back.easeOut' })
    this.scene.tweens.add({
      targets: t,
      x: to.x,
      y: to.y,
      scale: 0.5,
      delay: 420,
      duration: 520,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        t.setActive(false).setVisible(false)
        onArrive?.()
      },
    })
  }

  /** Büyüyüp sönen kombo yazısı. */
  burst(x: number, y: number, text: string, size: number, color = '#F6C445'): void {
    const t = this.get().setText(text).setFontSize(Math.round(size)).setColor(color).setStroke('#3B2416', Math.max(5, size * 0.16))
    t.setPosition(x, y).setScale(0.3).setAngle(-6)
    this.scene.tweens.add({ targets: t, scale: 1.25, angle: 3, duration: 300, ease: 'Back.easeOut' })
    this.scene.tweens.add({ targets: t, alpha: 0, scale: 1.6, delay: 700, duration: 350, onComplete: () => t.setActive(false).setVisible(false) })
  }

  destroy(): void {
    for (const t of this.pool) t.destroy()
  }
}

export class StarsPop {
  private readonly scene: Phaser.Scene
  private readonly stars: Phaser.GameObjects.Image[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    for (let i = 0; i < 3; i++) this.stars.push(scene.add.image(0, 0, 'icon_star').setDepth(88).setVisible(false))
  }

  show(x: number, y: number, n: number, size: number, onStar?: (i: number) => void): void {
    this.stars.forEach((s, i) => {
      const filled = i < n
      s.setTexture(filled ? 'icon_star' : 'icon_star_empty')
      s.setPosition(x + (i - 1) * size * 1.05, y - (i === 1 ? size * 0.25 : 0)).setDisplaySize(size, size).setVisible(true).setAlpha(1)
      const sc = s.scale
      s.setScale(0)
      this.scene.tweens.add({
        targets: s,
        scale: sc,
        angle: { from: -40, to: 0 },
        duration: 280,
        delay: i * 140,
        ease: 'Back.easeOut',
        onStart: () => {
          if (filled) onStar?.(i)
        },
      })
      this.scene.tweens.add({ targets: s, alpha: 0, y: s.y - size * 0.4, delay: 1300 + i * 60, duration: 320, onComplete: () => s.setVisible(false) })
    })
  }

  destroy(): void {
    for (const s of this.stars) s.destroy()
  }
}
