/**
 * Bardak texture'ları: glassModel profilinden çizilir, böylece görünen seviye hesaplanan hacimle birebir tutar.
 * Üç katman aynı boyut ve hizada üretilir:
 *   back   — arka cam duvarı ve arka ağız (sıvının arkasında)
 *   liquid — iç silüet, beyaz; ortası parlak kenarları koyu. Çay rengiyle tint'lenir, seviyeye göre kırpılır.
 *   front  — cam gövde tonu, kalın dip, desen (decal), keskin parlamalar, kalın kontur ve ağız dudağı.
 * Görünüm tools/art/lib/teaGlass.mjs ile aynıdır (parlak cartoon). Bakış ~15° yukarıdan: kesitler elips.
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

const PAD = 16

export function glassGeometry(id: GlassProfileId): GlassGeometry {
  const model = getGlassModel(id)
  const def = model.def
  const hpx = GLASS_TEX_UNIT * def.height
  const wall = def.wall * hpx
  const maxR = model.maxRadius * hpx
  const halfW = maxR + wall + PAD
  const cx = halfW + 4
  const texW = Math.ceil(cx + halfW)
  const rimRy = (model.radiusAt(1) * hpx + wall) * ELLIPSE_K
  const yTop = PAD + rimRy + 4
  const yBot = yTop + hpx
  const yBase = yBot + def.base * hpx
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

/** Dış silüet: ağzın arka yarısı + sağ kenar + kalın dip + dip ön yayı + sol kenar. */
function outerPath(ctx: CanvasRenderingContext2D, g: GlassGeometry, steps = 80): void {
  const k = ELLIPSE_K
  const rTop = g.r(1) + g.wall
  const rBase = (g.r(0) + g.wall) * 1.02
  const r0 = g.r(0) + g.wall
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, rTop, rTop * k, 0, Math.PI, 0, false)
  for (let i = steps; i >= 0; i--) {
    const h = i / steps
    ctx.lineTo(g.cx + g.r(h) + g.wall, g.y(h))
  }
  ctx.quadraticCurveTo(g.cx + r0 + g.wall * 0.6, g.yBase - (g.yBase - g.yBot) * 0.2, g.cx + rBase, g.yBase)
  ctx.ellipse(g.cx, g.yBase, rBase, rBase * k, 0, 0, Math.PI, false)
  ctx.quadraticCurveTo(g.cx - r0 - g.wall * 0.6, g.yBase - (g.yBase - g.yBot) * 0.2, g.cx - r0, g.yBot)
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

/** Profili izleyen parlama çizgisi. rel: yarıçapın oranı (negatif: sol). */
function profileStroke(ctx: CanvasRenderingContext2D, g: GlassGeometry, rel: number, t0: number, t1: number, width: number, alpha: number) {
  ctx.beginPath()
  const steps = 40
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps
    const x = g.cx + (g.r(t) + g.wall * 0.5) * rel
    if (i === 0) ctx.moveTo(x, g.y(t))
    else ctx.lineTo(x, g.y(t))
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = width
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`
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
    grad.addColorStop(0, 'rgb(105,105,105)')
    grad.addColorStop(0.16, 'rgb(200,200,200)')
    grad.addColorStop(0.4, 'rgb(255,255,255)')
    grad.addColorStop(0.62, 'rgb(246,246,246)')
    grad.addColorStop(0.88, 'rgb(170,170,170)')
    grad.addColorStop(1, 'rgb(95,95,95)')
    ctx.fillStyle = grad
    ctx.fillRect(g.cx - R - 2, y, R * 2 + 4, 1.2)
  }
  // Dibe doğru koyulaşma
  const vg = ctx.createLinearGradient(0, g.yTop, 0, g.yBot + 10)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(0.7, 'rgba(0,0,0,0.06)')
  vg.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = vg
  ctx.fillRect(0, g.yTop - 20, g.texW, g.yBot - g.yTop + 40)
  ctx.restore()
}

function drawGlassBack(ctx: CanvasRenderingContext2D, g: GlassGeometry, skin: GlassSkin) {
  const k = ELLIPSE_K
  const r1 = g.r(1)
  ctx.save()
  innerPath(ctx, g)
  ctx.fillStyle = rgba(skin.glass, skin.glassAlpha * 0.55)
  ctx.fill()
  ctx.clip()
  // Arka duvardaki dikey yansıma (sağda)
  const grad = ctx.createLinearGradient(g.cx + r1 * 0.2, 0, g.cx + r1, 0)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.7, 'rgba(255,255,255,0.2)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(g.cx, g.yTop - 40, r1 * 1.2, g.hpx + 80)
  ctx.restore()
  // Ağzın arka yarısı (cam arkadan görünür)
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, r1 + g.wall * 0.5, (r1 + g.wall * 0.5) * k, 0, Math.PI, 0)
  ctx.lineWidth = Math.max(2, g.hpx * 0.012)
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
  const lw = Math.max(3, g.hpx * 0.022)
  const r1 = g.r(1) + g.wall
  const r0 = g.r(0) + g.wall
  const rBase = r0 * 1.02

  ctx.save()
  outerPath(ctx, g)
  // Cam gövde: kenarlarda dolu, ortada şeffaf
  const body = ctx.createLinearGradient(g.cx - r1, 0, g.cx + r1, 0)
  body.addColorStop(0, rgba(skin.glass, Math.min(0.9, skin.glassAlpha * 3.4)))
  body.addColorStop(0.22, rgba(skin.glass, skin.glassAlpha * 1.2))
  body.addColorStop(0.55, 'rgba(255,255,255,0.06)')
  body.addColorStop(0.85, rgba(skin.glass, skin.glassAlpha * 1.5))
  body.addColorStop(1, rgba(skin.glass, Math.min(0.9, skin.glassAlpha * 3.4)))
  ctx.fillStyle = body
  ctx.fill()
  ctx.clip()
  // Kalın cam dip
  ctx.fillStyle = rgba(skin.glass, Math.min(0.85, skin.glassAlpha * 3))
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yBot, r0, r0 * k, 0, Math.PI, 0, true)
  ctx.lineTo(g.cx + rBase, g.yBase)
  ctx.ellipse(g.cx, g.yBase, rBase, rBase * k, 0, 0, Math.PI, false)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(g.cx - r0 * 0.7, g.yBot + (g.yBase - g.yBot) * 0.45)
  ctx.quadraticCurveTo(g.cx, g.yBase + rBase * k * 0.4, g.cx + r0 * 0.55, g.yBot + (g.yBase - g.yBot) * 0.5)
  ctx.lineWidth = lw * 0.9
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.stroke()
  if (decal) {
    ctx.globalAlpha = 0.92
    wrapDecal(ctx, g, decal.img, decal.w, decal.h)
    ctx.globalAlpha = 1
  }
  // Keskin parlamalar: solda uzun şerit + kısa çizgi, sağda ince kenar ışığı
  profileStroke(ctx, g, -0.62, 0.1, 0.9, g.hpx * 0.055, 0.72)
  profileStroke(ctx, g, -0.4, 0.62, 0.84, g.hpx * 0.025, 0.6)
  profileStroke(ctx, g, 0.8, 0.18, 0.78, g.hpx * 0.02, 0.45)
  ctx.restore()

  // Dış kontur
  ctx.lineJoin = 'round'
  ctx.lineWidth = lw
  ctx.strokeStyle = skin.outline
  outerPath(ctx, g)
  ctx.stroke()
  // Dip iç elipsi
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yBot, g.r(0), g.r(0) * k, 0, 0, Math.PI)
  ctx.lineWidth = lw * 0.45
  ctx.strokeStyle = rgba(skin.outline, 0.45)
  ctx.stroke()
  // Ağız: ön dudak (kalın, parlak) + kontur + parıltı
  const rr = r1 - g.wall * 0.5
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, rr, rr * k, 0, 0, Math.PI)
  ctx.lineWidth = Math.max(lw * 1.1, g.wall * 1.3)
  ctx.strokeStyle = skin.rim === '#FFFFFF' ? 'rgba(255,255,255,0.85)' : skin.rim
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, r1, r1 * k, 0, 0, Math.PI * 2)
  ctx.lineWidth = lw * 0.85
  ctx.strokeStyle = skin.outline
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(g.cx - r1 * 0.55, g.yTop + r1 * k * 0.55, r1 * 0.18, r1 * k * 0.28, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fill()
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
