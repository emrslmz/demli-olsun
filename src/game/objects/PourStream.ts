/**
 * Ağızdan bardağa uzanan akış çizgisi. Kalınlığı akış hızına bağlı ve hafifçe dalgalanır.
 * Bırakınca akışın üst ucu ağızdan kopar ve aşağı iner (detach).
 * Az noktalı poligon: her karede ~24 nokta.
 */

import type * as Phaser from 'phaser'

const SEGMENTS = 12

export interface StreamStyle {
  color: number
  alpha: number
  highlight: number
  /** Tam akıştaki kalınlık (px). */
  width: number
}

export class PourStream {
  readonly gfx: Phaser.GameObjects.Graphics
  private readonly pts: { x: number; y: number; w: number }[] = []
  private t = 0
  /** Akışın kopan üst ucunun eğri üzerindeki konumu (0: ağız, 1: yüzey). */
  private detach = 0

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics()
    for (let i = 0; i <= SEGMENTS; i++) this.pts.push({ x: 0, y: 0, w: 0 })
  }

  /**
   * from: ağız ucu, dir: çıkış yönü, to: temas noktası, ratio: 0..1 akış, streaming: akış sürüyor mu,
   * held: basılı mı (değilse üst uç kopar).
   */
  draw(
    dt: number,
    from: { x: number; y: number },
    dir: { x: number; y: number },
    to: { x: number; y: number },
    ratio: number,
    held: boolean,
    style: StreamStyle,
  ): void {
    this.t += dt
    const g = this.gfx
    g.clear()
    if (held) this.detach = 0
    else this.detach = Math.min(1, this.detach + dt * 3.5)
    if (ratio <= 0.01 || this.detach >= 0.98) return
    const dx = to.x - from.x
    const dy = to.y - from.y
    const len = Math.hypot(dx, dy)
    // Kuadratik Bezier: ağız yönünde bir kontrol noktası, sonra yerçekimiyle düşüş.
    const cx = from.x + dir.x * len * 0.32
    const cy = from.y + dir.y * len * 0.32 - len * 0.02
    const baseW = Math.max(2, style.width * Math.pow(ratio, 0.6))
    for (let i = 0; i <= SEGMENTS; i++) {
      const tt = i / SEGMENTS
      const u = 1 - tt
      const x = u * u * from.x + 2 * u * tt * cx + tt * tt * to.x
      const y = u * u * from.y + 2 * u * tt * cy + tt * tt * to.y
      const wob = Math.sin(this.t * 22 + tt * 9) * baseW * 0.18 * tt
      const p = this.pts[i] as { x: number; y: number; w: number }
      p.x = x + wob
      p.y = y
      // Akış hızlandıkça incelir.
      p.w = baseW * (1 - 0.3 * tt) * (0.85 + 0.15 * Math.sin(this.t * 31 + tt * 13))
    }
    const start = Math.floor(this.detach * SEGMENTS)
    g.fillStyle(style.color, style.alpha)
    g.beginPath()
    for (let i = start; i <= SEGMENTS; i++) {
      const p = this.pts[i] as { x: number; y: number; w: number }
      const q = this.pts[Math.min(SEGMENTS, i + 1)] as { x: number; y: number; w: number }
      const r = this.pts[Math.max(0, i - 1)] as { x: number; y: number; w: number }
      const tx = q.x - r.x
      const ty = q.y - r.y
      const tl = Math.hypot(tx, ty) || 1
      const nx = -ty / tl
      const ny = tx / tl
      if (i === start) g.moveTo(p.x + (nx * p.w) / 2, p.y + (ny * p.w) / 2)
      else g.lineTo(p.x + (nx * p.w) / 2, p.y + (ny * p.w) / 2)
    }
    for (let i = SEGMENTS; i >= start; i--) {
      const p = this.pts[i] as { x: number; y: number; w: number }
      const q = this.pts[Math.min(SEGMENTS, i + 1)] as { x: number; y: number; w: number }
      const r = this.pts[Math.max(0, i - 1)] as { x: number; y: number; w: number }
      const tx = q.x - r.x
      const ty = q.y - r.y
      const tl = Math.hypot(tx, ty) || 1
      const nx = -ty / tl
      const ny = tx / tl
      g.lineTo(p.x - (nx * p.w) / 2, p.y - (ny * p.w) / 2)
    }
    g.closePath()
    g.fillPath()
    // Parlama çizgisi
    g.lineStyle(Math.max(1, baseW * 0.18), style.highlight, 0.55 * style.alpha)
    g.beginPath()
    for (let i = start; i <= SEGMENTS; i++) {
      const p = this.pts[i] as { x: number; y: number; w: number }
      if (i === start) g.moveTo(p.x - p.w * 0.18, p.y)
      else g.lineTo(p.x - p.w * 0.18, p.y)
    }
    g.strokePath()
  }

  clear(): void {
    this.gfx.clear()
    this.detach = 1
  }

  destroy(): void {
    this.gfx.destroy()
  }
}
