/**
 * Göstergeler: bardağın yanında dikey doluluk, altında yatay dem göstergesi. İkisinde de hedef işaretli.
 * Modlar: 'numbers' (rakam + işaret), 'marks' (sadece işaret), 'none' (göz kararı: gizli).
 */

import * as Phaser from 'phaser'
import type { GaugeMode } from '@/config/gameplay'
import { FIXED_COLORS, FONTS } from '@/config/theme'
import { rgbToInt, teaColor } from '@/core/teaColor'
import { hexToInt } from '@/services/theme/ThemeService'
import type { Rect } from '../layout'

const DARK = 0x3b2416
const CHALK = hexToInt(FIXED_COLORS.chalk)
const MARK = 0xe8463a

function labelStyle(size: number): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONTS.ui,
    fontStyle: '900',
    fontSize: `${Math.round(size)}px`,
    color: '#FFF6E6',
    stroke: '#3B2416',
    strokeThickness: Math.max(2, size * 0.22),
  }
}

export class FillGauge {
  private readonly frame: Phaser.GameObjects.Graphics
  private readonly bar: Phaser.GameObjects.Rectangle
  private readonly mark: Phaser.GameObjects.Graphics
  private readonly targetLabel: Phaser.GameObjects.Text
  private readonly valueLabel: Phaser.GameObjects.Text
  private rect: Rect = { x: 0, y: 0, w: 10, h: 100 }
  private mode: GaugeMode = 'numbers'
  private target: number | null = null
  private value = 0
  private u = 1

  constructor(scene: Phaser.Scene) {
    this.frame = scene.add.graphics()
    this.bar = scene.add.rectangle(0, 0, 10, 10, CHALK, 0.95).setOrigin(0, 1)
    this.mark = scene.add.graphics()
    this.targetLabel = scene.add.text(0, 0, '', labelStyle(20)).setOrigin(0, 0.5)
    this.valueLabel = scene.add.text(0, 0, '', labelStyle(18)).setOrigin(0.5, 0)
  }

  layout(r: Rect, u: number): void {
    this.rect = r
    this.u = u
    const g = this.frame
    g.clear()
    const rad = r.w / 2
    g.fillStyle(DARK, 0.85)
    g.fillRoundedRect(r.x - 4 * u, r.y - 4 * u, r.w + 8 * u, r.h + 8 * u, rad + 4 * u)
    g.fillStyle(0x1e2b24, 0.9)
    g.fillRoundedRect(r.x, r.y, r.w, r.h, rad)
    // Çeyrek çizgileri
    g.lineStyle(Math.max(1, 2 * u), CHALK, 0.25)
    for (let i = 1; i < 4; i++) {
      const y = r.y + r.h * (1 - i / 4)
      g.lineBetween(r.x + r.w * 0.2, y, r.x + r.w * 0.8, y)
    }
    this.bar.setPosition(r.x + 3 * u, r.y + r.h - 3 * u)
    this.targetLabel.setStyle(labelStyle(30 * u))
    this.valueLabel.setStyle(labelStyle(26 * u))
    this.refresh()
  }

  setMode(mode: GaugeMode): void {
    this.mode = mode
    this.refresh()
  }

  setTarget(pct: number | null): void {
    this.target = pct
    this.refresh()
  }

  /** pct: doluluk yüzdesi (0..100+). */
  setValue(pct: number): void {
    if (Math.abs(pct - this.value) < 0.05) return
    this.value = pct
    this.refreshValue()
  }

  private refreshValue(): void {
    const r = this.rect
    const inner = r.h - 6 * this.u
    const v = Math.max(0, Math.min(100, this.value))
    this.bar.setSize(r.w - 6 * this.u, Math.max(0.001, (inner * v) / 100))
    this.bar.setFillStyle(this.value > 100 ? MARK : CHALK, 0.95)
    if (this.mode === 'numbers') {
      this.valueLabel.setText(`%${Math.round(Math.max(0, this.value))}`)
      this.valueLabel.setPosition(r.x + r.w / 2, r.y + r.h + 8 * this.u)
    }
  }

  private refresh(): void {
    const visible = this.mode !== 'none'
    this.frame.setVisible(visible)
    this.bar.setVisible(visible)
    this.mark.setVisible(visible && this.target !== null)
    this.targetLabel.setVisible(visible && this.mode === 'numbers' && this.target !== null)
    this.valueLabel.setVisible(visible && this.mode === 'numbers')
    const r = this.rect
    const u = this.u
    const m = this.mark
    m.clear()
    if (this.target !== null) {
      const y = r.y + 3 * u + (r.h - 6 * u) * (1 - this.target / 100)
      m.lineStyle(Math.max(2, 5 * u), MARK, 1)
      m.lineBetween(r.x - 8 * u, y, r.x + r.w + 8 * u, y)
      m.fillStyle(MARK, 1)
      m.lineStyle(Math.max(1, 3 * u), DARK, 1)
      const tx = r.x + r.w + 8 * u
      m.fillTriangle(tx, y, tx + 20 * u, y - 13 * u, tx + 20 * u, y + 13 * u)
      m.strokeTriangle(tx, y, tx + 20 * u, y - 13 * u, tx + 20 * u, y + 13 * u)
      this.targetLabel.setText(`%${this.target}`)
      this.targetLabel.setPosition(tx + 24 * u, y)
    }
    this.refreshValue()
  }

  setAlpha(a: number): void {
    for (const o of [this.frame, this.bar, this.mark, this.targetLabel, this.valueLabel]) o.setAlpha(a)
  }

  setDepth(d: number): void {
    for (const o of [this.frame, this.bar, this.mark, this.targetLabel, this.valueLabel]) o.setDepth(d)
  }

  destroy(): void {
    for (const o of [this.frame, this.bar, this.mark, this.targetLabel, this.valueLabel]) o.destroy()
  }
}

/** Dem göstergesi texture'u: çay renk ölçeği (renk temaya göre değişmez). */
export function ensureDemGradient(scene: Phaser.Scene): string {
  const key = 'ca_demgrad'
  if (scene.textures.exists(key)) return key
  const w = 256
  const tex = scene.textures.createCanvas(key, w, 8)
  if (!tex) return key
  const ctx = tex.getContext()
  for (let x = 0; x < w; x++) {
    const c = teaColor(x / (w - 1))
    // Gösterge zemini koyu olduğundan opak renk kullanılır.
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`
    ctx.fillRect(x, 0, 1, 8)
  }
  tex.refresh()
  return key
}

export class DemGauge {
  private readonly frame: Phaser.GameObjects.Graphics
  private readonly grad: Phaser.GameObjects.Image
  private readonly pointer: Phaser.GameObjects.Graphics
  private readonly mark: Phaser.GameObjects.Graphics
  private readonly targetLabel: Phaser.GameObjects.Text
  private readonly valueLabel: Phaser.GameObjects.Text
  private rect: Rect = { x: 0, y: 0, w: 100, h: 10 }
  private mode: GaugeMode = 'numbers'
  private target: number | null = null
  private value = 0
  private hasLiquid = false
  private u = 1

  constructor(scene: Phaser.Scene) {
    this.frame = scene.add.graphics()
    this.grad = scene.add.image(0, 0, ensureDemGradient(scene)).setOrigin(0, 0)
    this.mark = scene.add.graphics()
    this.pointer = scene.add.graphics()
    this.targetLabel = scene.add.text(0, 0, '', labelStyle(20)).setOrigin(0.5, 1)
    this.valueLabel = scene.add.text(0, 0, '', labelStyle(18)).setOrigin(0.5, 0)
  }

  layout(r: Rect, u: number): void {
    this.rect = r
    this.u = u
    const g = this.frame
    g.clear()
    g.fillStyle(DARK, 0.85)
    g.fillRoundedRect(r.x - 4 * u, r.y - 4 * u, r.w + 8 * u, r.h + 8 * u, r.h / 2 + 4 * u)
    this.grad.setPosition(r.x, r.y).setDisplaySize(r.w, r.h)
    this.targetLabel.setStyle(labelStyle(30 * u))
    this.valueLabel.setStyle(labelStyle(26 * u))
    this.refresh()
  }

  setMode(mode: GaugeMode): void {
    this.mode = mode
    this.refresh()
  }

  setTarget(pct: number | null): void {
    this.target = pct
    this.refresh()
  }

  setValue(pct: number, hasLiquid: boolean): void {
    if (Math.abs(pct - this.value) < 0.05 && hasLiquid === this.hasLiquid) return
    this.value = pct
    this.hasLiquid = hasLiquid
    this.refreshValue()
  }

  private refreshValue(): void {
    const r = this.rect
    const u = this.u
    const p = this.pointer
    p.clear()
    if (!this.hasLiquid) {
      this.valueLabel.setText('')
      return
    }
    const x = r.x + (r.w * Math.max(0, Math.min(100, this.value))) / 100
    const y = r.y + r.h + 3 * u
    const c = teaColor(this.value / 100)
    p.fillStyle(0xfff6e6, 1)
    p.lineStyle(Math.max(1, 3 * u), DARK, 1)
    p.fillTriangle(x, y, x - 13 * u, y + 20 * u, x + 13 * u, y + 20 * u)
    p.strokeTriangle(x, y, x - 13 * u, y + 20 * u, x + 13 * u, y + 20 * u)
    p.fillStyle(rgbToInt(c), 1)
    p.fillCircle(x, y + 26 * u, 6 * u)
    if (this.mode === 'numbers') {
      this.valueLabel.setText(`%${Math.round(this.value)}`)
      this.valueLabel.setPosition(x, y + 30 * u)
    }
  }

  private refresh(): void {
    const visible = this.mode !== 'none'
    for (const o of [this.frame, this.grad, this.pointer]) o.setVisible(visible)
    this.mark.setVisible(visible && this.target !== null)
    this.targetLabel.setVisible(visible && this.mode === 'numbers' && this.target !== null)
    this.valueLabel.setVisible(visible && this.mode === 'numbers')
    const m = this.mark
    m.clear()
    const r = this.rect
    const u = this.u
    if (this.target !== null) {
      const x = r.x + (r.w * this.target) / 100
      m.lineStyle(Math.max(2, 5 * u), MARK, 1)
      m.lineBetween(x, r.y - 10 * u, x, r.y + r.h + 4 * u)
      m.fillStyle(MARK, 1)
      m.lineStyle(Math.max(1, 3 * u), DARK, 1)
      m.fillTriangle(x, r.y - 6 * u, x - 12 * u, r.y - 24 * u, x + 12 * u, r.y - 24 * u)
      m.strokeTriangle(x, r.y - 6 * u, x - 12 * u, r.y - 24 * u, x + 12 * u, r.y - 24 * u)
      this.targetLabel.setText(`%${this.target}`)
      this.targetLabel.setPosition(x, r.y - 26 * u)
    }
    this.refreshValue()
  }

  setAlpha(a: number): void {
    for (const o of [this.frame, this.grad, this.pointer, this.mark, this.targetLabel, this.valueLabel]) o.setAlpha(a)
  }

  setDepth(d: number): void {
    for (const o of [this.frame, this.grad, this.pointer, this.mark, this.targetLabel, this.valueLabel]) o.setDepth(d)
  }

  destroy(): void {
    for (const o of [this.frame, this.grad, this.pointer, this.mark, this.targetLabel, this.valueLabel]) o.destroy()
  }
}
