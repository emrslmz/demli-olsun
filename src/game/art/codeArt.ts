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
}
