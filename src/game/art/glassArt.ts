/**
 * Bardak texture'ları: glassModel profilinden çizilir, böylece görünen seviye hesaplanan hacimle birebir tutar.
 * Üç katman aynı boyut ve hizada üretilir:
 *   back   — arka cam duvarı / fincanın iç yüzü (sıvının arkasında)
 *   liquid — iç silüet, beyaz; ortası parlak kenarları koyu. Çay rengiyle tint'lenir, seviyeye göre kırpılır.
 *   front  — kontur, ağız, parlamalar, kalın dip, desen (decal), kulp. Porselende opak gövde.
 * Bakış açısı ~15° yukarıdan: her yatay kesit bir elips (ry = rx × ELLIPSE_K).
 */

import type * as Phaser from 'phaser'
import { getGlassModel, type GlassModel, type GlassProfileId } from '@/core/glassModel'
import type { GlassSkin } from '@/data/cosmetics'
import { canvasTexture } from './codeArt'

export const ELLIPSE_K = 0.26
/** İnce belli bardağın iç yüksekliği (texture pikseli). */
export const GLASS_TEX_UNIT = 420

export interface GlassGeometry {
  id: GlassProfileId
  model: GlassModel
  /** İç yükseklik (px). */
  hpx: number
  cx: number
  /** İç dip (h=0) ve ağız (h=1) y'si. */
  yBot: number
  yTop: number
  /** Dış dip y'si (bardağın oturduğu nokta, ön kenar hariç). */
  yBase: number
  wall: number
  texW: number
  texH: number
  /** h → iç yarıçap (px). */
  r(h: number): number
  /** h → y (px). */
  y(h: number): number
}

const PAD = 14

export function glassGeometry(id: GlassProfileId): GlassGeometry {
  const model = getGlassModel(id)
  const def = model.def
  const hpx = GLASS_TEX_UNIT * def.height
  const wall = def.wall * hpx
  const maxR = model.maxRadius * hpx
  const handleW = def.handle ? maxR * 0.62 : 0
  const halfW = maxR + wall + PAD
  const cx = halfW + 4
  const texW = Math.ceil(cx + halfW + handleW)
  const rimRy = (model.radiusAt(1) * hpx + wall) * ELLIPSE_K
  const yTop = PAD + rimRy + 4
  const yBot = yTop + hpx
  const base = def.base * hpx
  const yBase = yBot + base
  const baseRy = (model.radiusAt(0) * hpx + wall) * ELLIPSE_K
  const texH = Math.ceil(yBase + baseRy + PAD)
  return {
    id,
    model,
    hpx,
    cx,
    yBot,
    yTop,
    yBase,
    wall,
    texW,
    texH,
    r: (h) => model.radiusAt(Math.max(0, Math.min(1, h))) * hpx,
    y: (h) => yBot - h * hpx,
  }
}

/** Dış silüet yolu (ağız elipsinin ön yarısı dahil değil; ağız ayrıca çizilir). */
function outerPath(ctx: CanvasRenderingContext2D, g: GlassGeometry, steps = 80): void {
  const k = ELLIPSE_K
  const rTop = g.r(1) + g.wall
  const rBase = g.r(0) + g.wall
  ctx.beginPath()
  // Ağız arka yarısı (soldan sağa üstten)
  ctx.ellipse(g.cx, g.yTop, rTop, rTop * k, 0, Math.PI, 0, false)
  // Sağ kenar aşağı
  for (let i = steps; i >= 0; i--) {
    const h = i / steps
    ctx.lineTo(g.cx + g.r(h) + g.wall, g.y(h))
  }
  ctx.lineTo(g.cx + rBase, g.yBase)
  // Dip ön kenarı
  ctx.ellipse(g.cx, g.yBase, rBase, rBase * k, 0, 0, Math.PI, false)
  // Sol kenar yukarı
  for (let i = 0; i <= steps; i++) {
    const h = i / steps
    ctx.lineTo(g.cx - g.r(h) - g.wall, g.y(h))
  }
  ctx.closePath()
}

/** İç silüet (sıvının kaplayabileceği alan): ağız elipsinin üst yarısı + yanlar + dip elipsinin ön yarısı. */
function innerPath(ctx: CanvasRenderingContext2D, g: GlassGeometry, steps = 80): void {
  const k = ELLIPSE_K
  const r0 = g.r(0)
  const r1 = g.r(1)
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, r1, r1 * k, 0, Math.PI, 0, false)
  for (let i = steps; i >= 0; i--) {
    const h = i / steps
    ctx.lineTo(g.cx + g.r(h), g.y(h))
  }
  ctx.ellipse(g.cx, g.yBot, r0, r0 * k, 0, 0, Math.PI, false)
  for (let i = 0; i <= steps; i++) {
    const h = i / steps
    ctx.lineTo(g.cx - g.r(h), g.y(h))
  }
  ctx.closePath()
}

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function drawHandle(ctx: CanvasRenderingContext2D, g: GlassGeometry, fill: string, outline: string, lw: number) {
  const rMid = g.r(0.55) + g.wall
  const x0 = g.cx + rMid - g.wall * 0.5
  const yA = g.y(0.82)
  const yB = g.y(0.22)
  const reach = g.model.maxRadius * g.hpx * 0.55
  const thick = g.hpx * 0.07
  ctx.beginPath()
  ctx.moveTo(x0, yA - thick / 2)
  ctx.bezierCurveTo(x0 + reach * 1.15, yA - thick, x0 + reach * 1.2, yB + thick, x0, yB + thick / 2)
  ctx.lineTo(x0, yB - thick / 2)
  ctx.bezierCurveTo(x0 + reach * 0.7, yB, x0 + reach * 0.68, yA, x0, yA + thick / 2)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = lw
  ctx.strokeStyle = outline
  ctx.lineJoin = 'round'
  ctx.stroke()
}

/** Deseni bardağın ön yüzüne silindirik olarak sarar (satır satır, şeritlerle). */
function wrapDecal(ctx: CanvasRenderingContext2D, g: GlassGeometry, img: CanvasImageSource, iw: number, ih: number) {
  const strips = 10
  const top = g.yTop
  const bottom = g.yBase
  const rows = Math.ceil(bottom - top)
  for (let row = 0; row < rows; row += 2) {
    const y = top + row
    const h = (g.yBot - y) / g.hpx
    const R = (h >= 0 ? g.r(h) : g.r(0)) + g.wall * 0.6
    const v = row / rows
    const sy = v * ih
    for (let s = 0; s < strips; s++) {
      const u0 = s / strips
      const u1 = (s + 1) / strips
      const x0 = g.cx + R * Math.sin(Math.PI * (u0 - 0.5))
      const x1 = g.cx + R * Math.sin(Math.PI * (u1 - 0.5))
      ctx.drawImage(img, u0 * iw, sy, (u1 - u0) * iw, (2 / rows) * ih, x0, y, x1 - x0 + 0.6, 2.4)
    }
  }
}

export interface GlassTextureKeys {
  back: string
  liquid: string
  front: string
  geometry: GlassGeometry
}

const geomCache = new Map<GlassProfileId, GlassGeometry>()

export function getGlassGeometry(id: GlassProfileId): GlassGeometry {
  let g = geomCache.get(id)
  if (!g) {
    g = glassGeometry(id)
    geomCache.set(id, g)
  }
  return g
}

export function glassKeys(id: GlassProfileId, skinId: string): GlassTextureKeys {
  return {
    back: `glass_${id}_${skinId}_back`,
    liquid: `glass_${id}_liquid`,
    front: `glass_${id}_${skinId}_front`,
    geometry: getGlassGeometry(id),
  }
}

/** Sıvı texture'u: iç silüet, satır satır yatay parlaklık profili (kenar koyu, orta parlak). */
function drawLiquid(ctx: CanvasRenderingContext2D, g: GlassGeometry) {
  ctx.save()
  innerPath(ctx, g)
  ctx.clip()
  const y0 = Math.floor(g.yTop - g.r(1) * ELLIPSE_K)
  const y1 = Math.ceil(g.yBot + g.r(0) * ELLIPSE_K)
  for (let y = y0; y <= y1; y++) {
    const h = Math.max(0, Math.min(1, (g.yBot - y) / g.hpx))
    const R = g.r(h)
    const grad = ctx.createLinearGradient(g.cx - R, 0, g.cx + R, 0)
    grad.addColorStop(0, 'rgb(120,120,120)')
    grad.addColorStop(0.18, 'rgb(205,205,205)')
    grad.addColorStop(0.42, 'rgb(255,255,255)')
    grad.addColorStop(0.62, 'rgb(250,250,250)')
    grad.addColorStop(0.88, 'rgb(185,185,185)')
    grad.addColorStop(1, 'rgb(110,110,110)')
    ctx.fillStyle = grad
    ctx.fillRect(g.cx - R - 2, y, R * 2 + 4, 1.2)
  }
  ctx.restore()
}

function drawGlassBack(ctx: CanvasRenderingContext2D, g: GlassGeometry, skin: GlassSkin) {
  const k = ELLIPSE_K
  const r1 = g.r(1)
  if (g.model.def.opaque) {
    // Fincanın iç yüzü: ağız elipsi, arkası gölgeli porselen.
    const grad = ctx.createLinearGradient(0, g.yTop - r1 * k, 0, g.yTop + r1 * k)
    grad.addColorStop(0, '#d9dde2')
    grad.addColorStop(1, '#fbfbf8')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(g.cx, g.yTop, r1, r1 * k, 0, 0, Math.PI * 2)
    ctx.fill()
    // İç duvar boyunca gölge
    ctx.fillStyle = 'rgba(80,90,110,0.18)'
    ctx.beginPath()
    ctx.ellipse(g.cx, g.yTop + r1 * k * 0.25, r1 * 0.92, r1 * k * 0.7, 0, Math.PI, 0)
    ctx.fill()
    return
  }
  ctx.save()
  innerPath(ctx, g)
  ctx.fillStyle = rgba(skin.glass, skin.glassAlpha * 0.6)
  ctx.fill()
  ctx.restore()
  // Arka duvardaki dikey yansıma (sağda)
  ctx.save()
  innerPath(ctx, g)
  ctx.clip()
  const grad = ctx.createLinearGradient(g.cx + r1 * 0.2, 0, g.cx + r1, 0)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.7, 'rgba(255,255,255,0.18)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(g.cx, g.yTop - 40, r1 * 1.2, g.hpx + 80)
  ctx.restore()
  // Ağzın arka yarısı (cam arkadan görünür)
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, r1 + g.wall * 0.5, (r1 + g.wall * 0.5) * k, 0, Math.PI, 0)
  ctx.lineWidth = Math.max(2, g.wall * 0.55)
  ctx.strokeStyle = rgba(skin.outline, 0.45)
  ctx.stroke()
}

function drawGlassFront(
  ctx: CanvasRenderingContext2D,
  g: GlassGeometry,
  skin: GlassSkin,
  decal: { img: CanvasImageSource; w: number; h: number } | null,
) {
  const k = ELLIPSE_K
  const lw = Math.max(3, g.hpx * 0.014)
  const r1 = g.r(1) + g.wall
  const r0 = g.r(0) + g.wall
  const def = g.model.def

  if (def.handle) {
    drawHandle(ctx, g, def.opaque ? '#fbfbf6' : rgba(skin.glass, 0.55), skin.outline, lw)
  }

  if (def.opaque) {
    // Porselen gövde: ağzın ön yarısından aşağısı opak.
    ctx.save()
    outerPath(ctx, g)
    ctx.clip()
    const grad = ctx.createLinearGradient(g.cx - r1, 0, g.cx + r1, 0)
    grad.addColorStop(0, '#e6e8ea')
    grad.addColorStop(0.3, '#ffffff')
    grad.addColorStop(0.75, '#f3f3ef')
    grad.addColorStop(1, '#cfd4da')
    ctx.fillStyle = grad
    ctx.fillRect(0, g.yTop, g.texW, g.texH)
    // Kobalt mavisi ağız bandı ve lale motifi
    ctx.strokeStyle = '#1F4E8C'
    ctx.lineWidth = g.hpx * 0.05
    ctx.beginPath()
    ctx.ellipse(g.cx, g.yTop + g.hpx * 0.05, r1, r1 * k, 0, 0.05, Math.PI - 0.05)
    ctx.stroke()
    ctx.lineWidth = g.hpx * 0.018
    ctx.beginPath()
    ctx.ellipse(g.cx, g.yBot - g.hpx * 0.05, g.r(0.1) + g.wall, (g.r(0.1) + g.wall) * k, 0, 0.1, Math.PI - 0.1)
    ctx.stroke()
    ctx.restore()
    // Ağız (iç) bölgesini aç: içi BACK + yüzey katmanından görünür.
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.ellipse(g.cx, g.yTop, g.r(1), g.r(1) * k, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else {
    // Cam gövde: çok hafif tint + kalın dip
    ctx.save()
    outerPath(ctx, g)
    ctx.fillStyle = rgba(skin.glass, skin.glassAlpha * 0.35)
    ctx.fill()
    ctx.clip()
    // Kalın cam dip
    ctx.fillStyle = rgba(skin.glass, Math.min(0.8, skin.glassAlpha * 2.2))
    ctx.beginPath()
    ctx.ellipse(g.cx, g.yBot, g.r(0), g.r(0) * k, 0, 0, Math.PI)
    ctx.lineTo(g.cx - r0, g.yBase)
    ctx.ellipse(g.cx, g.yBase, r0, r0 * k, 0, Math.PI, 0, true)
    ctx.closePath()
    ctx.fill()
    if (decal) {
      ctx.globalAlpha = 0.92
      wrapDecal(ctx, g, decal.img, decal.w, decal.h)
      ctx.globalAlpha = 1
    }
    // Sol parlama (ışık sol üstten): profili izleyen yumuşak şerit
    ctx.lineCap = 'round'
    for (const [off, width, alpha] of [
      [0.62, 0.12, 0.42],
      [0.48, 0.05, 0.55],
    ] as const) {
      ctx.beginPath()
      for (let i = 4; i <= 92; i++) {
        const h = i / 100
        const x = g.cx - (g.r(h) + g.wall * 0.3) * off
        const y = g.y(h)
        if (i === 4) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineWidth = g.hpx * width
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`
      ctx.stroke()
    }
    // Sağ kenarda ince yansıma
    ctx.beginPath()
    for (let i = 10; i <= 85; i++) {
      const h = i / 100
      const x = g.cx + (g.r(h) + g.wall * 0.2) * 0.86
      if (i === 10) ctx.moveTo(x, g.y(h))
      else ctx.lineTo(x, g.y(h))
    }
    ctx.lineWidth = g.hpx * 0.018
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.stroke()
    ctx.restore()
  }

  // Dış kontur
  ctx.lineJoin = 'round'
  ctx.lineWidth = lw
  ctx.strokeStyle = skin.outline
  outerPath(ctx, g)
  ctx.stroke()
  // Ağzın ön yarısı (kalın) + ağız kenarı rengi
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, r1 - g.wall * 0.5, (r1 - g.wall * 0.5) * k, 0, 0, Math.PI)
  ctx.lineWidth = Math.max(lw * 1.4, g.wall * 0.9)
  ctx.strokeStyle = skin.rim === '#FFFFFF' ? 'rgba(255,255,255,0.75)' : skin.rim
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, r1, r1 * k, 0, 0, Math.PI * 2)
  ctx.lineWidth = lw * 0.8
  ctx.strokeStyle = skin.outline
  ctx.stroke()
  if (!def.opaque) {
    // Dip iç elipsi (kalın camın üst yüzü)
    ctx.beginPath()
    ctx.ellipse(g.cx, g.yBot, g.r(0), g.r(0) * k, 0, 0, Math.PI)
    ctx.lineWidth = lw * 0.5
    ctx.strokeStyle = rgba(skin.outline, 0.4)
    ctx.stroke()
  }
  // Sol üstte tek yumuşak parıltı
  const hx = g.cx - g.r(0.88) * 0.55
  const hy = g.y(0.86)
  const spot = ctx.createRadialGradient(hx, hy, 0, hx, hy, g.hpx * 0.06)
  spot.addColorStop(0, 'rgba(255,255,255,0.9)')
  spot.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = spot
  ctx.fillRect(hx - g.hpx * 0.07, hy - g.hpx * 0.07, g.hpx * 0.14, g.hpx * 0.14)
}

function decalSource(scene: Phaser.Scene, key: string | null): { img: CanvasImageSource; w: number; h: number } | null {
  if (!key || !scene.textures.exists(key)) return null
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement
  return { img: src, w: src.width, h: src.height }
}

/** Bir bardak tipi + skin için texture'ları üretir (varsa yeniden üretmez). */
export function ensureGlassTextures(scene: Phaser.Scene, id: GlassProfileId, skin: GlassSkin, force = false): GlassTextureKeys {
  const keys = glassKeys(id, skin.id)
  const g = keys.geometry
  if (force || !scene.textures.exists(keys.liquid)) canvasTexture(scene, keys.liquid, g.texW, g.texH, (ctx) => drawLiquid(ctx, g))
  if (force || !scene.textures.exists(keys.back)) canvasTexture(scene, keys.back, g.texW, g.texH, (ctx) => drawGlassBack(ctx, g, skin))
  if (force || !scene.textures.exists(keys.front)) {
    const decal = decalSource(scene, skin.decal)
    canvasTexture(scene, keys.front, g.texW, g.texH, (ctx) => drawGlassFront(ctx, g, skin, decal))
  }
  return keys
}

/** Tema değişince bardak texture'larını siler (desenler temaya göre değişebilir). */
export function clearGlassTextures(scene: Phaser.Scene): void {
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith('glass_')) scene.textures.remove(key)
  }
}
