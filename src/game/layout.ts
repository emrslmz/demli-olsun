/**
 * Ekran boyutu + safe area → yerleşim. Tüm değerler cihaz pikseli (CSS × DPR).
 * Sabit 1080×1920 + letterbox yok: 9:21 telefondan 3:4 iPad'e kadar her oran dolu ve kesiksiz.
 * Telefonda içerik tam genişlik; tablette içerik kolonu ortalanır ve genişliği bir üst sınırla tutulur.
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
  board: Rect
  cardSlots: number
  bg: BgPlacement
  /** Tezgâh çizgisi (ekran y). */
  counterY: number
  /** İnce belli bardağın ekrandaki iç yüksekliği; diğer bardaklar buna göre ölçeklenir. */
  glassUnit: number
  glassCx: number
  /** Bardağın oturduğu y (tabak üstü). */
  glassBaseY: number
  saucer: { cx: number; y: number; w: number }
  /** Demlik/çaydanlık eğildiğinde ağzın varacağı hedef noktalar. */
  spoutTarget: { dem: { x: number; y: number }; su: { x: number; y: number } }
  potWidth: { demlik: number; caydanlik: number }
  fillGauge: Rect
  demGauge: Rect
  sugarBowl: { x: number; y: number; size: number }
  controls: { area: Rect; dem: Rect; serve: Rect; su: Rect }
  /** Tablette kenarlarda dekor müşterileri için boş alan var mı. */
  sideSpace: number
}

export interface BgSizes {
  phone: { w: number; h: number; counterY: number }
  tablet: { w: number; h: number; counterY: number }
}

export const DEFAULT_BG_SIZES: BgSizes = {
  phone: { w: 1080, h: 1920, counterY: 0.68 },
  tablet: { w: 1536, h: 2048, counterY: 0.68 },
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

export function computeLayout(
  W: number,
  H: number,
  dpr: number,
  safeCss: InsetsPx,
  bgSizes: BgSizes = DEFAULT_BG_SIZES,
): Layout {
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

  const hud: Rect = { x: colX + 16 * u, y: top + 10 * u, w: colW - 32 * u, h: 96 * u }

  // Tahta: tablette kolondan geniş olabilir (4 kart).
  const boardMaxW = Math.min(W - safe.left - safe.right - 24 * u, colW * 1.25)
  const boardW = Math.max(colW - 24 * u, boardMaxW)
  const cardMinW = 262 * u
  const cardSlots = (boardW - 60 * u) / 4 >= cardMinW ? 4 : 3
  const boardH = Math.min(352 * u, H * 0.2)
  const board: Rect = { x: cx - boardW / 2, y: hud.y + hud.h + 10 * u, w: boardW, h: boardH }

  const cover = placeBackground(W, H, bgSizes)
  const bgCounter = cover.y + bgSizes[cover.variant].counterY * cover.srcH * cover.scale

  // Kontroller: ekranın alt %20'sinde, en az 56dp.
  const minTouch = 56 * dpr
  const ctrlH = Math.max(minTouch * 1.6, Math.min(170 * u, H * 0.13))
  const ctrlY = bottom - ctrlH - 14 * u
  const controlsArea: Rect = { x: colX + 20 * u, y: ctrlY, w: colW - 40 * u, h: ctrlH }
  const gap = 18 * u
  const sideW = (controlsArea.w - gap * 2) * 0.34
  const midW = controlsArea.w - gap * 2 - sideW * 2
  const controls = {
    area: controlsArea,
    dem: { x: controlsArea.x, y: ctrlY, w: sideW, h: ctrlH },
    serve: { x: controlsArea.x + sideW + gap, y: ctrlY + ctrlH * 0.12, w: midW, h: ctrlH * 0.76 },
    su: { x: controlsArea.x + sideW + gap + midW + gap, y: ctrlY, w: sideW, h: ctrlH },
  }

  // Tezgâh çizgisi arka plandan gelir; kontrollerle tahta arasında kalacak şekilde sınırlanır.
  const minCounter = board.y + board.h + 380 * u
  const maxCounter = ctrlY - 150 * u
  const counterY = Math.max(minCounter, Math.min(maxCounter, bgCounter))
  const bg = alignBackground(cover, bgSizes[cover.variant].counterY, counterY, W, H)

  const saucerW = 300 * u
  const saucerY = counterY - 6 * u
  const glassBaseY = saucerY - 16 * u
  const space = glassBaseY - (board.y + board.h)
  const glassUnit = Math.max(170 * u, Math.min(330 * u, space * 0.5))

  const glassTop = glassBaseY - glassUnit * 1.12
  const spoutTarget = {
    dem: { x: cx - 70 * u, y: glassTop - 50 * u },
    su: { x: cx + 70 * u, y: glassTop - 50 * u },
  }

  const fillGauge: Rect = { x: cx + 205 * u, y: glassBaseY - glassUnit * 1.1, w: 26 * u, h: glassUnit * 1.1 }
  const demGauge: Rect = { x: cx - 200 * u, y: counterY + 46 * u, w: 400 * u, h: 26 * u }
  const sugarBowl = { x: cx + 360 * u, y: counterY - 4 * u, size: 150 * u }

  return {
    W,
    H,
    dpr,
    u,
    safe,
    col: { x: colX, w: colW, cx },
    isTablet,
    hud,
    board,
    cardSlots,
    bg,
    counterY,
    glassUnit,
    glassCx: cx,
    glassBaseY,
    saucer: { cx, y: saucerY, w: saucerW },
    spoutTarget,
    potWidth: { demlik: 300 * u, caydanlik: 330 * u },
    fillGauge,
    demGauge,
    sugarBowl,
    controls,
    sideSpace: Math.max(0, (W - colW) / 2),
  }
}
