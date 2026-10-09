/**
 * Büyük, tıknaz butonlar: DEM ve SU basılı tutma alanları ve "Servis et".
 * Dokunma alanları en az 56dp; girişler gecikmesiz olsun diye pointerdown ile alınır.
 */

import * as Phaser from 'phaser'
import { FONTS } from '@/config/theme'
import type { Rect } from '../layout'

const DARK = 0x3b2416

function shade(color: number, f: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((color >> 16) & 255) * f)))
  const g = Math.min(255, Math.max(0, Math.round(((color >> 8) & 255) * f)))
  const b = Math.min(255, Math.max(0, Math.round((color & 255) * f)))
  return (r << 16) | (g << 8) | b
}

export interface ChunkyButtonOpts {
  color: number
  icon?: string
  label: string
  /** Etiket rengi */
  textColor?: string
  hold?: boolean
}

export class ChunkyButton {
  readonly container: Phaser.GameObjects.Container
  private readonly bg: Phaser.GameObjects.Graphics
  private readonly icon: Phaser.GameObjects.Image | null
  private readonly label: Phaser.GameObjects.Text
  readonly zone: Phaser.GameObjects.Zone
  private rect: Rect = { x: 0, y: 0, w: 100, h: 60 }
  private u = 1
  private pressed = false
  private enabled = true
  private highlight = 0
  private readonly pointers = new Set<number>()
  private color: number
  onDown: (() => void) | null = null
  onUp: (() => void) | null = null

  constructor(scene: Phaser.Scene, opts: ChunkyButtonOpts) {
    this.color = opts.color
    this.container = scene.add.container(0, 0)
    this.bg = scene.add.graphics()
    this.icon = opts.icon && scene.textures.exists(opts.icon) ? scene.add.image(0, 0, opts.icon) : null
    this.label = scene.add.text(0, 0, opts.label, {
      fontFamily: FONTS.ui,
      fontStyle: '900',
      fontSize: '32px',
      color: opts.textColor ?? '#FFF6E6',
      stroke: '#3B2416',
      strokeThickness: 6,
    })
    this.label.setOrigin(0.5)
    this.container.add([this.bg, ...(this.icon ? [this.icon] : []), this.label])
    this.zone = scene.add.zone(0, 0, 10, 10).setOrigin(0, 0).setInteractive()
    this.zone.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (!this.enabled) return
      this.pointers.add(p.id)
      if (!this.pressed) {
        this.setPressed(true)
        this.onDown?.()
      }
    })
    const up = (p: Phaser.Input.Pointer) => {
      if (!this.pointers.has(p.id)) return
      this.pointers.delete(p.id)
      if (this.pointers.size === 0 && this.pressed) {
        this.setPressed(false)
        this.onUp?.()
      }
    }
    this.zone.on(Phaser.Input.Events.POINTER_UP, up)
    this.zone.on(Phaser.Input.Events.POINTER_OUT, up)
    scene.input.on(Phaser.Input.Events.POINTER_UP, up)
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, up)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(Phaser.Input.Events.POINTER_UP, up)
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, up)
    })
  }

  layout(r: Rect, u: number): void {
    this.rect = r
    this.u = u
    // Dokunma alanı görselden biraz geniş.
    const pad = 10 * u
    this.zone.setPosition(r.x - pad, r.y - pad).setSize(r.w + pad * 2, r.h + pad * 2)
    this.zone.input?.hitArea.setTo(0, 0, r.w + pad * 2, r.h + pad * 2)
    this.container.setPosition(r.x + r.w / 2, r.y + r.h / 2)
    const fs = Math.min(r.h * 0.26, r.w * 0.2)
    this.label.setFontSize(Math.round(fs))
    this.label.setStroke('#3B2416', Math.max(3, fs * 0.2))
    if (this.icon) {
      const s = Math.min(r.h * 0.48, r.w * 0.42)
      this.icon.setDisplaySize(s, s)
      const vertical = r.h > r.w * 0.75
      if (vertical) {
        this.icon.setPosition(0, -r.h * 0.12)
        this.label.setPosition(0, r.h * 0.28)
      } else {
        this.icon.setPosition(-r.w * 0.3, 0)
        this.label.setPosition(r.w * 0.1, 0)
      }
    } else {
      this.label.setPosition(0, 0)
    }
    this.redraw()
  }

  setColor(color: number): void {
    this.color = color
    this.redraw()
  }

  setLabel(text: string): void {
    this.label.setText(text)
  }

  /** 0..1: basılıyken ya da akış sürerken parlama. */
  setHighlight(v: number): void {
    if (Math.abs(v - this.highlight) < 0.05) return
    this.highlight = v
    this.redraw()
  }

  private redraw(): void {
    const g = this.bg
    const { w, h } = this.rect
    const u = this.u
    const rad = Math.min(h, w) * 0.24
    const depth = 9 * u
    const off = this.pressed ? depth * 0.7 : 0
    g.clear()
    g.setPosition(0, 0)
    // Gölge (alt kalınlık)
    g.fillStyle(DARK, 1)
    g.fillRoundedRect(-w / 2 - 3 * u, -h / 2 - 3 * u + depth, w + 6 * u, h + 6 * u, rad + 3 * u)
    // Gövde
    g.fillStyle(DARK, 1)
    g.fillRoundedRect(-w / 2 - 3 * u, -h / 2 - 3 * u + off, w + 6 * u, h + 6 * u, rad + 3 * u)
    const base = this.pressed ? shade(this.color, 0.86) : this.color
    g.fillStyle(base, 1)
    g.fillRoundedRect(-w / 2, -h / 2 + off, w, h, rad)
    // Üst parlama
    g.fillStyle(0xffffff, 0.18 + 0.12 * this.highlight)
    g.fillRoundedRect(-w / 2 + 6 * u, -h / 2 + off + 5 * u, w - 12 * u, h * 0.38, rad * 0.8)
    if (this.highlight > 0) {
      g.lineStyle(5 * u, 0xfff6e6, 0.6 * this.highlight)
      g.strokeRoundedRect(-w / 2 + 4 * u, -h / 2 + off + 4 * u, w - 8 * u, h - 8 * u, rad * 0.85)
    }
    this.icon?.setY((this.rect.h > this.rect.w * 0.75 ? -this.rect.h * 0.12 : 0) + off)
    this.label.setY((this.icon ? (this.rect.h > this.rect.w * 0.75 ? this.rect.h * 0.28 : 0) : 0) + off)
    this.container.setAlpha(this.enabled ? 1 : 0.5)
  }

  private setPressed(p: boolean): void {
    this.pressed = p
    this.redraw()
  }

  /** Dışarıdan basılı bırakma (ör. diğer alana basıldı: son basılan geçerli). */
  forceRelease(): void {
    this.pointers.clear()
    if (this.pressed) this.setPressed(false)
  }

  get isPressed(): boolean {
    return this.pressed
  }

  setEnabled(e: boolean): void {
    if (this.enabled === e) return
    this.enabled = e
    if (!e) this.forceRelease()
    this.redraw()
  }

  get isEnabled(): boolean {
    return this.enabled
  }

  setVisible(v: boolean): void {
    this.container.setVisible(v)
    this.zone.setVisible(v)
    if (v) this.zone.setInteractive()
    else this.zone.disableInteractive()
  }

  destroy(): void {
    this.container.destroy(true)
    this.zone.destroy()
  }
}
