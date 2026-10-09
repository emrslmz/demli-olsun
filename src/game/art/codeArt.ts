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
  // Eğitim için işaret eden el (beyaz eldiven, kalın kahve kontur)
  canvasTexture(scene, 'ca_hand', 128, 168, (ctx) => {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    const path = () => {
      ctx.beginPath()
      // İşaret parmağı (yukarı)
      ctx.moveTo(52, 92)
      ctx.lineTo(52, 22)
      ctx.quadraticCurveTo(52, 6, 66, 6)
      ctx.quadraticCurveTo(80, 6, 80, 22)
      ctx.lineTo(80, 74)
      // Diğer parmaklar (kıvrık)
      ctx.quadraticCurveTo(84, 62, 96, 66)
      ctx.quadraticCurveTo(106, 70, 104, 84)
      ctx.quadraticCurveTo(114, 78, 120, 92)
      ctx.lineTo(120, 118)
      ctx.quadraticCurveTo(120, 150, 92, 160)
      ctx.lineTo(56, 160)
      ctx.quadraticCurveTo(26, 150, 18, 120)
      ctx.lineTo(10, 100)
      ctx.quadraticCurveTo(6, 84, 22, 84)
      ctx.quadraticCurveTo(34, 86, 40, 100)
      ctx.lineTo(52, 112)
      ctx.closePath()
    }
    path()
    ctx.fillStyle = '#FFFDF7'
    ctx.fill()
    ctx.lineWidth = 8
    ctx.strokeStyle = '#3B2416'
    ctx.stroke()
    // Gölge ve parmak çizgileri
    ctx.save()
    path()
    ctx.clip()
    ctx.fillStyle = 'rgba(160,150,140,0.35)'
    ctx.fillRect(90, 60, 40, 110)
    ctx.restore()
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(84, 92)
    ctx.quadraticCurveTo(92, 96, 98, 90)
    ctx.moveTo(98, 106)
    ctx.quadraticCurveTo(106, 110, 114, 104)
    ctx.stroke()
    ctx.fillStyle = '#E2B33C'
    ctx.fillRect(40, 146, 72, 14)
    ctx.strokeRect(40, 146, 72, 14)
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
