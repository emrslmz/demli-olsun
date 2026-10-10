/**
 * Ekran boyutu + safe area → yerleşim. Tüm değerler cihaz pikseli (CSS × DPR).
 * Sabit 1080×1920 + letterbox yok: 9:21 telefondan 3:4 iPad'e kadar her oran dolu ve kesiksiz.
 *
 * Sahne (yukarıdan aşağı): HUD → tezgâhın arkasında duran müşteri ve sipariş balonu → tezgâh arka kenarı
 * (counterY) → tezgâh üstünde tabaklı bardak, iki yanda dinlenen demlik ve çaydanlık, önde şekerlik →
 * tezgâh önü → DEM / Servis / SU butonları.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface InsetsPx {
  top: number
  right: number
  bottom: number
  left: number
}

export interface BgPlacement {
  variant: 'phone' | 'tablet'
  /** Görselin piksel boyutu. */
  srcW: number
  srcH: number
  scale: number
  x: number
  y: number
}

export interface Point {
  x: number
  y: number
}

export interface Layout {
  W: number
  H: number
  dpr: number
  /** Tasarım birimi: içerik kolonu genişliği / 1000. */
  u: number
  safe: InsetsPx
  col: { x: number; w: number; cx: number }
  isTablet: boolean
  hud: Rect
  bg: BgPlacement
  /** Tezgâhın arka kenarı (ekran y). Müşteri bu çizginin arkasında durur. */
  counterY: number
  /** Tezgâh üst yüzeyinin ön kenarı; altında tezgâh önü paneli başlar. */
  counterFrontY: number
  /** Müşteri görseli (kare): alt kenarı tezgâhın arkasında kalır. */
  customer: { cx: number; bottom: number; size: number }
  /** Sipariş balonu (müşterinin yanında). */
  bubble: Rect & { tailX: number; tailY: number }
  /** Bardağın iç yüksekliği (px). */
  glassUnit: number
  glassCx: number
  /** Bardağın oturduğu y (tabak üstü). */
  glassBaseY: number
  saucer: { cx: number; y: number; w: number }
  /** Demlik/çaydanlık: tezgâhta dinlenme noktası (alt orta) ve dökerken ağzın varacağı nokta. */
  pots: { dem: { rest: Point; spout: Point }; su: { rest: Point; spout: Point } }
  potWidth: { demlik: number; caydanlik: number }
  sugarBowl: { x: number; y: number; size: number }
  controls: { area: Rect; dem: Rect; serve: Rect; su: Rect }
  /** Tablette kolonun yanlarındaki boşluk. */
  sideSpace: number
}

export interface BgSizes {
  phone: { w: number; h: number; counterY: number }
  tablet: { w: number; h: number; counterY: number }
}

export const DEFAULT_BG_SIZES: BgSizes = {
  phone: { w: 1080, h: 2340, counterY: 0.5 },
  tablet: { w: 1536, h: 2048, counterY: 0.5 },
}

/** Ekran oranına en yakın arka plan seçilir ve cover ölçeklenir. */
export function placeBackground(W: number, H: number, sizes: BgSizes): BgPlacement {
  const aspect = H / W
  const phoneAspect = sizes.phone.h / sizes.phone.w
  const tabletAspect = sizes.tablet.h / sizes.tablet.w
  const variant = Math.abs(Math.log(aspect / phoneAspect)) <= Math.abs(Math.log(aspect / tabletAspect)) ? 'phone' : 'tablet'
  const s = sizes[variant]
  const scale = Math.max(W / s.w, H / s.h)
  return {
    variant,
    srcW: s.w,
    srcH: s.h,
    scale,
    x: (W - s.w * scale) / 2,
    y: (H - s.h * scale) / 2,
  }
}

/**
 * Arka planı, tezgâh çizgisi hedef y'ye denk gelecek ve ekranı yine tamamen kaplayacak şekilde
 * ölçekler/kaydırır. Tezgâh hedefle zaten çakışıyorsa cover yerleşimi aynen kalır.
 */
export function alignBackground(cover: BgPlacement, counterFrac: number, counterY: number, W: number, H: number): BgPlacement {
  const h = cover.srcH
  const s = Math.max(cover.scale, counterY / (counterFrac * h), (H - counterY) / ((1 - counterFrac) * h))
  return {
    ...cover,
    scale: s,
    x: (W - cover.srcW * s) / 2,
    y: counterY - counterFrac * h * s,
  }
}

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))

export function computeLayout(W: number, H: number, dpr: number, safeCss: InsetsPx, bgSizes: BgSizes = DEFAULT_BG_SIZES): Layout {
  const safe: InsetsPx = {
    top: safeCss.top * dpr,
    right: safeCss.right * dpr,
    bottom: safeCss.bottom * dpr,
    left: safeCss.left * dpr,
  }
  const usableW = W - safe.left - safe.right
  // Kolon: telefonda tam genişlik, tablette yüksekliğin %62'si ile sınırlı.
  const colW = Math.min(usableW, H * 0.62)
  const colX = safe.left + (usableW - colW) / 2
  const cx = colX + colW / 2
  const u = colW / 1000
  const isTablet = W / H > 0.66
  const top = safe.top
  const bottom = H - safe.bottom

  const hud: Rect = { x: colX + 16 * u, y: top + 10 * u, w: colW - 32 * u, h: 100 * u }
  const hudBottom = hud.y + hud.h

  // Kontroller: ekranın altında, en az 56dp yükseklik.
  const minTouch = 56 * dpr
  const ctrlH = Math.max(minTouch * 1.6, Math.min(170 * u, H * 0.12))
  const ctrlY = bottom - ctrlH - 18 * u
  const controlsArea: Rect = { x: colX + 20 * u, y: ctrlY, w: colW - 40 * u, h: ctrlH }
  const gap = 18 * u
  const sideW = (controlsArea.w - gap * 2) * 0.34
  const midW = controlsArea.w - gap * 2 - sideW * 2
  const controls = {
    area: controlsArea,
    dem: { x: controlsArea.x, y: ctrlY, w: sideW, h: ctrlH },
    serve: { x: controlsArea.x + sideW + gap, y: ctrlY + ctrlH * 0.1, w: midW, h: ctrlH * 0.8 },
    su: { x: controlsArea.x + sideW + gap + midW + gap, y: ctrlY, w: sideW, h: ctrlH },
  }

  // Tezgâh arka kenarı: müşteriye yer kalsın, tezgâh üstüne de bardak sığsın.
  const counterY = clamp(H * 0.42, hudBottom + 420 * u, ctrlY - 640 * u)
  const glassBaseY = Math.min(counterY + (ctrlY - counterY) * 0.6, ctrlY - 240 * u)
  const glassUnit = clamp((glassBaseY - counterY) * 0.86, 230 * u, 430 * u)
  const glassTopY = glassBaseY - glassUnit * 1.12
  const counterFrontY = Math.min(ctrlY - 40 * u, glassBaseY + 120 * u)

  const cover = placeBackground(W, H, bgSizes)
  const bg = alignBackground(cover, bgSizes[cover.variant].counterY, counterY, W, H)

  // Müşteri: biraz sağda durur, alt kenarı tezgâhın arkasında kalır. Balon solunda, baş hizasında.
  const custSize = clamp((counterY - hudBottom) * 1.05, 480 * u, 640 * u)
  const custBottom = counterY + custSize * 0.12
  const custTop = custBottom - custSize
  const custCx = cx + 160 * u
  const customer = { cx: custCx, bottom: custBottom, size: custSize }
  const bw = 440 * u
  const bh = 270 * u
  const headY = custTop + custSize * 0.42
  const bubble = {
    x: colX + 22 * u,
    y: clamp(headY - bh * 0.62, hudBottom + 8 * u, counterY - bh - 30 * u),
    w: bw,
    h: bh,
    tailX: custCx - custSize * 0.14,
    tailY: custTop + custSize * 0.55,
  }

  const saucerW = Math.max(300 * u, glassUnit * 0.95)
  const potRestY = glassBaseY - 30 * u
  const spoutY = glassTopY - 80 * u
  const pots = {
    dem: { rest: { x: cx - 330 * u, y: potRestY }, spout: { x: cx - 50 * u, y: spoutY } },
    su: { rest: { x: cx + 330 * u, y: potRestY }, spout: { x: cx + 50 * u, y: spoutY } },
  }
  const sugarBowl = { x: cx - 300 * u, y: Math.min(counterFrontY - 20 * u, glassBaseY + 70 * u), size: 150 * u }

  return {
    W,
    H,
    dpr,
    u,
    safe,
    col: { x: colX, w: colW, cx },
    isTablet,
    hud,
    bg,
    counterY,
    counterFrontY,
    customer,
    bubble,
    glassUnit,
    glassCx: cx,
    glassBaseY,
    saucer: { cx, y: glassBaseY + 6 * u, w: saucerW },
    pots,
    potWidth: { demlik: 270 * u, caydanlik: 300 * u },
    sugarBowl,
    controls,
    sideSpace: Math.max(0, (W - colW) / 2),
  }
}
