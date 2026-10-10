/**
 * Bardak texture'ları: glassModel profilinden çizilir, böylece görünen seviye hesaplanan hacimle birebir tutar.
 * Üç katman aynı boyut ve hizada üretilir:
 *   back   — iç cam tonu ve ağzın arka kenarı (sıvının arkasında)
 *   liquid — iç silüet: düz beyaz + sağda tek ton koyu bant. Çay rengiyle tint'lenir, seviyeye göre kırpılır.
 *   front  — cam duvarları, kalın dip, desen (decal), sağ gölge bandı, beyaz parlama şeritleri, kalın kontur, ağız.
 * Düz cartoon vektör dili (gradyan yok); görünüm tools/art/lib/teaGlass.mjs ile aynıdır. Bakış ~15° yukarıdan.
 */

import type * as Phaser from 'phaser'
import { lowestOpaqueRow, profileFromRows, rowsFromAlpha } from '@/core/glassMask'
import { createGlassModel, getGlassModel, type GlassModel, type GlassProfileId } from '@/core/glassModel'
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
/** Kalın dibin tabana doğru genişlemesi. */
const BASE_FLARE = 1.1
/** Dokunun sağında kulp için ek genişlik (iç yükseklik oranı). */
const HANDLE_PAD = 0.24

export function glassGeometry(id: GlassProfileId): GlassGeometry {
  const model = getGlassModel(id)
  const def = model.def
  const hpx = GLASS_TEX_UNIT * def.height
  const wall = def.wall * hpx
  const maxR = model.maxRadius * hpx
  const halfW = maxR + wall + PAD
  const cx = halfW + 4
  // Sağda kulp / zarf halkası için pay.
  const texW = Math.ceil(cx + halfW + hpx * HANDLE_PAD)
  const rimRy = (model.radiusAt(1) * hpx + wall) * ELLIPSE_K
  const yTop = PAD + rimRy + 4
  const yBot = yTop + hpx
  const yBase = yBot + def.base * hpx
  const baseRy = (model.radiusAt(0) * hpx + wall) * BASE_FLARE * ELLIPSE_K
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
  const rBase = (g.r(0) + g.wall) * BASE_FLARE
  const r0 = g.r(0) + g.wall
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, rTop, rTop * k, 0, Math.PI, 0, false)
  for (let i = steps; i >= 0; i--) {
    const h = i / steps
    ctx.lineTo(g.cx + g.r(h) + g.wall, g.y(h))
  }
  ctx.quadraticCurveTo(g.cx + r0 + g.wall * 0.6, g.yBase - (g.yBase - g.yBot) * 0.3, g.cx + rBase, g.yBase)
  ctx.ellipse(g.cx, g.yBase, rBase, rBase * k, 0, 0, Math.PI, false)
  ctx.quadraticCurveTo(g.cx - r0 - g.wall * 0.6, g.yBase - (g.yBase - g.yBot) * 0.3, g.cx - r0, g.yBot)
  for (let i = 0; i <= steps; i++) {
    const h = i / steps
    ctx.lineTo(g.cx - g.r(h) - g.wall, g.y(h))
  }
  ctx.closePath()
}

/** İç silüet (sıvının kaplayabileceği alan): ağız elipsinin üst yarısı + yanlar + dip elipsinin ön yarısı. */
function innerPath(ctx: CanvasRenderingContext2D, g: GlassGeometry, steps = 80, begin = true): void {
  const k = ELLIPSE_K
  const r0 = g.r(0)
  const r1 = g.r(1)
  if (begin) ctx.beginPath()
  else ctx.moveTo(g.cx - r1, g.yTop)
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

/** Profili izleyen kapalı şerit (rel0 → rel1, yarıçap oranı; dış yarıçapa göre). */
function bandPath(ctx: CanvasRenderingContext2D, g: GlassGeometry, rel0: number, rel1: number, t0: number, t1: number, steps = 40) {
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps
    const y = g.y(t)
    const x = g.cx + (g.r(t) + g.wall) * rel0
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  for (let i = steps; i >= 0; i--) {
    const t = t0 + ((t1 - t0) * i) / steps
    ctx.lineTo(g.cx + (g.r(t) + g.wall) * rel1, g.y(t))
  }
  ctx.closePath()
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

/** Sıvı texture'u: iç silüet düz beyaz, sağda tek ton koyu bant (tint ile çayın gölge tonu olur). */
function drawLiquid(ctx: CanvasRenderingContext2D, g: GlassGeometry) {
  ctx.save()
  innerPath(ctx, g)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = 'rgb(176,176,176)'
  bandPath(ctx, g, 0.42, 1.3, -0.15, 1.1)
  ctx.fill()
  ctx.restore()
}

function drawGlassBack(ctx: CanvasRenderingContext2D, g: GlassGeometry, skin: GlassSkin) {
  const k = ELLIPSE_K
  const ri = g.r(1)
  // İç cam tonu (çayın arkasında; boş kısımda camı gösterir)
  innerPath(ctx, g)
  ctx.fillStyle = rgba(skin.glass, Math.min(0.75, skin.glassAlpha * 2.4))
  ctx.fill()
  // Ağzın arka kenarı
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, ri, ri * k, 0, Math.PI, 0)
  ctx.lineWidth = Math.max(2, g.hpx * 0.015)
  ctx.strokeStyle = rgba(skin.outline, 0.5)
  ctx.stroke()
}

/** Rengi f ile koyulaştırır (f < 1). */
function darken(hex: string, f: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const c = (v: number) => Math.round(v * f)
  return `rgb(${c((n >> 16) & 255)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`
}

/** Dikey yivler: bardağın çevresinde eşit açılarla koyu ince çizgi + yanında parlak çizgi. */
function drawFacets(ctx: CanvasRenderingContext2D, g: GlassGeometry, skin: GlassSkin) {
  const n = 9
  for (let i = 1; i < n; i++) {
    const rel = Math.cos((i / n) * Math.PI)
    const line = (off: number, color: string, width: number) => {
      ctx.beginPath()
      for (let j = 0; j <= 40; j++) {
        const t = -0.05 + (1.03 * j) / 40
        const x = g.cx + (g.r(t) + g.wall) * rel + off
        if (j === 0) ctx.moveTo(x, g.y(t))
        else ctx.lineTo(x, g.y(t))
      }
      ctx.lineWidth = width
      ctx.strokeStyle = color
      ctx.stroke()
    }
    line(0, rgba(skin.outline, 0.22), g.hpx * 0.012)
    line(-g.hpx * 0.012, 'rgba(255,255,255,0.55)', g.hpx * 0.009)
  }
}

/** Sağda cam kulp: belin üstünden göbeğe inen C kıvrımı. */
function handlePath(ctx: CanvasRenderingContext2D, g: GlassGeometry) {
  const R = (t: number) => g.cx + g.r(t) + g.wall
  const out = g.hpx * 0.17
  ctx.beginPath()
  ctx.moveTo(R(0.8) - g.wall, g.y(0.8))
  ctx.bezierCurveTo(R(0.8) + out * 0.9, g.y(0.84), R(0.55) + out * 1.15, g.y(0.6), R(0.42) + out * 0.55, g.y(0.36))
  ctx.quadraticCurveTo(R(0.3) + out * 0.25, g.y(0.24), R(0.24) - g.wall, g.y(0.24))
}

function drawHandle(ctx: CanvasRenderingContext2D, g: GlassGeometry, skin: GlassSkin, lw: number) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  handlePath(ctx, g)
  ctx.lineWidth = g.hpx * 0.06 + lw * 2
  ctx.strokeStyle = skin.outline
  ctx.stroke()
  handlePath(ctx, g)
  ctx.lineWidth = g.hpx * 0.06
  ctx.strokeStyle = rgba(skin.glass, 1)
  ctx.stroke()
  handlePath(ctx, g)
  ctx.lineWidth = g.hpx * 0.018
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.stroke()
}

/** Metal zarf (Osmanlı usulü bardak tutacağı): bardağın alt yarısını sarar, tırtıklı üst kenar, işleme, halka kulp. */
function drawZarf(ctx: CanvasRenderingContext2D, g: GlassGeometry, skin: GlassSkin, lw: number) {
  const k = ELLIPSE_K
  const top = 0.44
  const pad = g.wall * 1.4
  const R = (t: number) => g.r(t) + g.wall + pad
  const rFoot = (g.r(0) + g.wall) * BASE_FLARE * 1.12
  const yFoot = g.yBase
  const path = () => {
    ctx.beginPath()
    // Üst kenar: ön yay boyunca dalgalı (tırtıklı)
    const rt = R(top)
    const n = 14
    for (let i = 0; i <= n * 4; i++) {
      const a = Math.PI - (i / (n * 4)) * Math.PI
      const bump = Math.abs(Math.sin((i / 4) * Math.PI)) * g.hpx * 0.035
      const x = g.cx + Math.cos(a) * rt
      const y = g.y(top) + Math.sin(a) * rt * k - bump
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    for (let i = 0; i <= 30; i++) {
      const t = top - (top * i) / 30
      ctx.lineTo(g.cx + R(t), g.y(t))
    }
    ctx.lineTo(g.cx + rFoot, yFoot)
    ctx.ellipse(g.cx, yFoot, rFoot, rFoot * k, 0, 0, Math.PI, false)
    for (let i = 0; i <= 30; i++) {
      const t = (top * i) / 30
      ctx.lineTo(g.cx - R(t), g.y(t))
    }
    ctx.closePath()
  }
  ctx.save()
  path()
  ctx.fillStyle = '#C9D1D9'
  ctx.fill()
  ctx.clip()
  // Sağ gölge bandı, sol parlama
  ctx.fillStyle = '#9AA6B2'
  ctx.fillRect(g.cx + R(0.2) * 0.45, g.y(top) - g.hpx * 0.1, R(0.2) * 1.2, g.hpx)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(g.cx - R(0.2) * 0.72, g.y(top), R(0.2) * 0.14, g.hpx)
  // İşleme: iki sıra nokta ve aralarında kıvrım
  ctx.fillStyle = 'rgba(59,36,22,0.55)'
  for (const t of [0.34, 0.08]) {
    const r = R(t)
    for (let i = 1; i < 16; i++) {
      const a = Math.PI - (i / 16) * Math.PI
      ctx.beginPath()
      ctx.arc(g.cx + Math.cos(a) * r * 0.96, g.y(t) + Math.sin(a) * r * k, g.hpx * 0.009, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.beginPath()
  const r2 = R(0.21)
  for (let i = 0; i <= 60; i++) {
    const a = Math.PI - (i / 60) * Math.PI
    const x = g.cx + Math.cos(a) * r2 * 0.96
    const y = g.y(0.21) + Math.sin(a) * r2 * k + Math.sin(i * 0.9) * g.hpx * 0.022
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.lineWidth = g.hpx * 0.01
  ctx.strokeStyle = 'rgba(59,36,22,0.5)'
  ctx.stroke()
  ctx.restore()
  path()
  ctx.lineJoin = 'round'
  ctx.lineWidth = lw
  ctx.strokeStyle = skin.outline
  ctx.stroke()
  // Halka kulp
  const hx = g.cx + R(0.22) + g.hpx * 0.07
  const hy = g.y(0.22)
  for (const [w, c] of [
    [g.hpx * 0.035 + lw * 2, skin.outline],
    [g.hpx * 0.035, '#C9D1D9'],
  ] as const) {
    ctx.beginPath()
    ctx.ellipse(hx, hy, g.hpx * 0.075, g.hpx * 0.1, 0, -Math.PI * 0.6, Math.PI * 0.6)
    ctx.lineWidth = w
    ctx.strokeStyle = c
    ctx.stroke()
  }
}

function drawGlassFront(
  ctx: CanvasRenderingContext2D,
  g: GlassGeometry,
  skin: GlassSkin,
  decal: { img: CanvasImageSource; w: number; h: number } | null,
) {
  const k = ELLIPSE_K
  const lw = Math.max(3, g.hpx * 0.03)
  const r1 = g.r(1) + g.wall
  const r0 = g.r(0) + g.wall
  const rBase = r0 * BASE_FLARE
  const baseMid = g.yBase - (g.yBase - g.yBot) * 0.35

  ctx.save()
  outerPath(ctx, g)
  ctx.clip()
  // Cam duvarları (dış silüet − iç silüet): düz açık ton
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, g.texW, g.texH)
  innerPath(ctx, g, 80, false)
  ctx.clip('evenodd')
  outerPath(ctx, g)
  ctx.fillStyle = rgba(skin.glass, 0.85)
  ctx.fill()
  ctx.restore()
  // Kalın cam dip: düz ton + altta koyu bant + iç dip çizgisi
  ctx.fillStyle = rgba(skin.glass, 0.95)
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yBot, r0, r0 * k, 0, Math.PI, 0, true)
  ctx.lineTo(g.cx + rBase, g.yBase)
  ctx.ellipse(g.cx, g.yBase, rBase, rBase * k, 0, 0, Math.PI, false)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = darken(skin.glass, 0.8)
  ctx.beginPath()
  ctx.ellipse(g.cx, baseMid, rBase, rBase * k, 0, Math.PI, 0, true)
  ctx.lineTo(g.cx + rBase, g.yBase)
  ctx.ellipse(g.cx, g.yBase, rBase, rBase * k, 0, 0, Math.PI, false)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yBot, r0, r0 * k, 0, 0, Math.PI)
  ctx.lineWidth = lw * 0.5
  ctx.strokeStyle = rgba(skin.outline, 0.55)
  ctx.stroke()
  if (decal) {
    ctx.globalAlpha = 0.95
    wrapDecal(ctx, g, decal.img, decal.w, decal.h)
    ctx.globalAlpha = 1
  }
  if (skin.facets) drawFacets(ctx, g, skin)
  // Sağda tek ton gölge bandı (cam + çay birlikte)
  ctx.fillStyle = 'rgba(29,74,92,0.14)'
  bandPath(ctx, g, 0.62, 1.3, -0.25, 1.05)
  ctx.fill()
  // Parlamalar: solda uzun kalın şerit + altında kısa kapsül, sağda kısa ince çizgi, dipte yay
  profileStroke(ctx, g, -0.66, 0.34, 0.9, g.hpx * 0.075, 0.95)
  profileStroke(ctx, g, -0.7, 0.1, 0.22, g.hpx * 0.06, 0.9)
  profileStroke(ctx, g, 0.74, 0.66, 0.86, g.hpx * 0.032, 0.85)
  ctx.beginPath()
  ctx.moveTo(g.cx - r0 * 0.62, g.yBot + (g.yBase - g.yBot) * 0.55)
  ctx.quadraticCurveTo(g.cx - r0 * 0.2, g.yBase + rBase * k * 0.2, g.cx + r0 * 0.2, g.yBot + (g.yBase - g.yBot) * 0.72)
  ctx.lineWidth = lw * 0.8
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.stroke()
  ctx.restore()

  if (skin.handle) drawHandle(ctx, g, skin, lw)
  // Dış kontur
  ctx.lineJoin = 'round'
  ctx.lineWidth = lw
  ctx.strokeStyle = skin.outline
  outerPath(ctx, g)
  ctx.stroke()
  if (skin.holder === 'zarf') drawZarf(ctx, g, skin, lw)
  // Ağız: kalın ön dudak + tam elips kontur + parıltı
  const rr = r1 - g.wall * 0.5
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, rr, rr * k, 0, 0, Math.PI)
  ctx.lineWidth = Math.max(lw * 1.2, g.wall * 1.2)
  ctx.strokeStyle = skin.rim
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(g.cx, g.yTop, r1, r1 * k, 0, 0, Math.PI * 2)
  ctx.lineWidth = lw * 0.9
  ctx.strokeStyle = skin.outline
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(g.cx - r1 * 0.5, g.yTop + r1 * k * 0.62, r1 * 0.16, r1 * k * 0.26, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
}

function decalSource(scene: Phaser.Scene, key: string | null): { img: CanvasImageSource; w: number; h: number } | null {
  if (!key || !scene.textures.exists(key)) return null
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement
  return { img: src, w: src.width, h: src.height }
}

// ---------- Kullanıcı bardak görselleri ----------

/**
 * Tema klasöründe (glass/) bu görseller varsa oyundaki bardak kodla değil bunlarla çizilir (ASSETS.md):
 *   bardak_on   — ön yüz: kontur, parlamalar, ağız, kalın dip (çayın ÜSTÜNDE çizilir; iç kısmı şeffaf/yarı şeffaf)
 *   bardak_ic   — iç maske: çayın kaplayabileceği alan opak, dışı şeffaf (çay buna göre kırpılır, profil buradan çıkar)
 *   bardak_arka — isteğe bağlı: çayın ARKASINDA kalan iç cam tonu, ağzın arka kenarı
 * Skin'e özel ön/arka yüz: bardak_on_<skin>, bardak_arka_<skin> (ör. bardak_on_nazar). Üçü de aynı boyutta olmalı.
 */
export const CUSTOM_GLASS = { front: 'bardak_on', mask: 'bardak_ic', back: 'bardak_arka' } as const

type ImgSrc = HTMLImageElement | HTMLCanvasElement

interface CustomGlass {
  mask: ImgSrc
  front: ImgSrc
  back: ImgSrc | null
  /** Ön yüz skin'e özel mi (öyleyse desen sarılmaz; çizimde zaten vardır). */
  perSkin: boolean
}

function texSource(scene: Phaser.Scene, key: string): ImgSrc | null {
  return scene.textures.exists(key) ? (scene.textures.get(key).getSourceImage() as ImgSrc) : null
}

function customSources(scene: Phaser.Scene, skinId: string): CustomGlass | null {
  const mask = texSource(scene, CUSTOM_GLASS.mask)
  const skinFront = texSource(scene, `${CUSTOM_GLASS.front}_${skinId}`)
  const front = skinFront ?? texSource(scene, CUSTOM_GLASS.front)
  if (!mask || !front) return null
  const back = texSource(scene, `${CUSTOM_GLASS.back}_${skinId}`) ?? texSource(scene, CUSTOM_GLASS.back)
  return { mask, front, back, perSkin: skinFront !== null }
}

function pixels(src: ImgSrc, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  ctx.drawImage(src, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

let customGeo: { mask: ImgSrc; front: ImgSrc; g: GlassGeometry | null } | null = null

/** Maskeden geometri: iç profil, ağız/dip y'leri; bardağın oturduğu y ön yüzün en alt opak satırından. */
function customGeometry(src: CustomGlass): GlassGeometry | null {
  if (customGeo && customGeo.mask === src.mask && customGeo.front === src.front) return customGeo.g
  const w = src.front.width
  const h = src.front.height
  const mp = profileFromRows(rowsFromAlpha(pixels(src.mask, w, h), w, h), ELLIPSE_K)
  let g: GlassGeometry | null = null
  if (mp) {
    const hpx = mp.yBot - mp.yTop
    const r0 = (mp.profile[0] as [number, number])[1] * hpx
    const lowest = lowestOpaqueRow(pixels(src.front, w, h), w, h)
    // Dış dip elipsinin merkezi (kodla çizilen bardakla aynı oturma noktası).
    const yBase = Math.max(mp.yBot, lowest - r0 * BASE_FLARE * ELLIPSE_K)
    const model = createGlassModel({
      id: 'ince',
      name: 'Özel bardak',
      height: 1,
      profile: mp.profile,
      wall: 0,
      base: (yBase - mp.yBot) / hpx,
      pathFactor: 1,
    })
    g = {
      id: 'ince',
      model,
      hpx,
      cx: mp.cx,
      yBot: mp.yBot,
      yTop: mp.yTop,
      yBase,
      wall: 0,
      texW: w,
      texH: h,
      r: (t) => model.radiusAt(Math.max(0, Math.min(1, t))) * hpx,
      y: (t) => mp.yBot - t * hpx,
    }
  } else {
    console.warn('[glass] bardak_ic maskesi okunamadı (boş ya da çok küçük); kodla çizilen bardak kullanılıyor.')
  }
  customGeo = { mask: src.mask, front: src.front, g }
  return g
}

function ensureCustomTextures(scene: Phaser.Scene, src: CustomGlass, g: GlassGeometry, skin: GlassSkin, force: boolean): GlassTextureKeys {
  const keys: GlassTextureKeys = {
    back: `glass_custom_${skin.id}_back`,
    liquid: 'glass_custom_liquid',
    front: `glass_custom_${skin.id}_front`,
    geometry: g,
  }
  const { texW: w, texH: h } = g
  if (force || !scene.textures.exists(keys.liquid)) {
    canvasTexture(scene, keys.liquid, w, h, (ctx) => {
      ctx.drawImage(src.mask, 0, 0, w, h)
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-atop'
      ctx.fillStyle = 'rgb(176,176,176)'
      bandPath(ctx, g, 0.42, 1.3, -0.15, 1.1)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    })
  }
  if (force || !scene.textures.exists(keys.back)) {
    canvasTexture(scene, keys.back, w, h, (ctx) => {
      if (src.back) ctx.drawImage(src.back, 0, 0, w, h)
    })
  }
  if (force || !scene.textures.exists(keys.front)) {
    const decal = src.perSkin ? null : decalSource(scene, skin.decal)
    canvasTexture(scene, keys.front, w, h, (ctx) => {
      ctx.drawImage(src.front, 0, 0, w, h)
      if (!decal) return
      // Desen bardağa sarılır ve iç maskeyle kırpılır.
      const tmp = document.createElement('canvas')
      tmp.width = w
      tmp.height = h
      const t = tmp.getContext('2d') as CanvasRenderingContext2D
      wrapDecal(t, g, decal.img, decal.w, decal.h)
      t.globalCompositeOperation = 'destination-in'
      t.drawImage(src.mask, 0, 0, w, h)
      ctx.globalAlpha = 0.95
      ctx.drawImage(tmp, 0, 0)
      ctx.globalAlpha = 1
    })
  }
  return keys
}

/**
 * Bir bardak tipi + skin için texture'ları üretir (varsa yeniden üretmez).
 * Temada kullanıcı bardak görselleri varsa onlar kullanılır; yoksa bardak kodla çizilir.
 */
export function ensureGlassTextures(scene: Phaser.Scene, id: GlassProfileId, skin: GlassSkin, force = false): GlassTextureKeys {
  const custom = customSources(scene, skin.id)
  const cg = custom ? customGeometry(custom) : null
  if (custom && cg) return ensureCustomTextures(scene, custom, cg, skin, force)
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
