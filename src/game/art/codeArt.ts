/**
 * Kodla çizilen texture'lar: bardak gövdeleri, sıvı, akış, göstergeler, butonlar, partiküller.
 * Canvas 2D ile bir kez üretilir. Renkler aktif temanın paletinden gelir (çay renkleri hariç).
 */

import type * as Phaser from 'phaser'

export function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key)
  const tex = scene.textures.createCanvas(key, Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)))
  if (!tex) return
  const ctx = tex.getContext()
  ctx.clearRect(0, 0, w, h)
  draw(ctx, w, h)
  tex.refresh()
}

function softCircle(ctx: CanvasRenderingContext2D, w: number, h: number, hard = 0.35) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(hard, 'rgba(255,255,255,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/** Tüm kod texture'larını üretir. */
export function generateCodeArt(scene: Phaser.Scene): void {
  canvasTexture(scene, 'ca_px', 4, 4, (ctx) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 4, 4)
  })
  canvasTexture(scene, 'ca_dot', 64, 64, (ctx, w, h) => softCircle(ctx, w, h, 0.45))
  canvasTexture(scene, 'ca_glow', 128, 128, (ctx, w, h) => softCircle(ctx, w, h, 0.05))
  // Damla: sivri üstlü gözyaşı
  canvasTexture(scene, 'ca_drop', 48, 64, (ctx, w, h) => {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(w / 2, 2)
    ctx.bezierCurveTo(w * 0.62, h * 0.3, w - 3, h * 0.5, w - 3, h * 0.66)
    ctx.arc(w / 2, h * 0.66, w / 2 - 3, 0, Math.PI)
    ctx.bezierCurveTo(3, h * 0.5, w * 0.38, h * 0.3, w / 2, 2)
    ctx.fill()
  })
  // Kabarcık halkası
  canvasTexture(scene, 'ca_ring', 64, 64, (ctx, w) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(w / 2, w / 2, w / 2 - 5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fill()
  })
}
