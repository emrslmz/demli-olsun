// Cartoon ince belli çay bardağı (SVG). Oyundaki bardakla (src/core/glassModel.ts + src/game/art/glassArt.ts) aynı
// iç profil ve aynı çizim dili: tombul göbek, belirgin dar bel, açılan ağız, kalın cam dip; düz (gradyansız) renkler,
// kalın koyu kontur, sağda tek ton gölge bandı, solda net beyaz parlama şeritleri.
// İkonlarda, raflarda, logoda ve rozetlerde bu çizim kullanılır.

import { C, ellipsePath, f, mix, newId, shade } from './svg.mjs'

export const GLASS_K = 0.26
/** İç profil [h, r] — iç yükseklik birimiyle (glassModel.ts ile aynı). */
export const INCE_PROFILE = [
  [0, 0.2],
  [0.05, 0.255],
  [0.12, 0.288],
  [0.2, 0.298],
  [0.3, 0.278],
  [0.4, 0.232],
  [0.5, 0.203],
  [0.6, 0.21],
  [0.72, 0.246],
  [0.86, 0.285],
  [1, 0.318],
]
export const INCE_WALL = 0.03
export const INCE_BASE = 0.11

function monotone(points) {
  const n = points.length
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const d = []
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]))
  const m = [d[0]]
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2)
  m.push(d[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * d[i]
      m[i + 1] = t * b * d[i]
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let i = 0
    while (i < n - 2 && x > xs[i + 1]) i++
    const h = xs[i + 1] - xs[i]
    const t = (x - xs[i]) / h
    const t2 = t * t
    const t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
  }
}

export const inceRadius = monotone(INCE_PROFILE)

/**
 * Bardak geometrisi: alt orta (cx, by) ve toplam yükseklik h (dip dahil, ağız elipsinin ortasına kadar).
 */
export function glassGeom(cx, by, h) {
  const ih = h / (1 + INCE_BASE)
  const yBot = by - INCE_BASE * ih
  const y = (t) => yBot - t * ih
  const r = (t) => inceRadius(Math.max(0, Math.min(1, t))) * ih
  const w = INCE_WALL * ih
  return { cx, by, h, ih, yBot, yTop: y(1), y, r, w, rTop: r(1) + w, rBase: (r(0) + w) * 1.1 }
}

function outerPath(g, steps = 40) {
  const k = GLASS_K
  const { cx } = g
  let d = `M${f(cx - g.rTop)} ${f(g.yTop)} A${f(g.rTop)} ${f(g.rTop * k)} 0 0 1 ${f(cx + g.rTop)} ${f(g.yTop)}`
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    d += ` L${f(cx + g.r(t) + g.w)} ${f(g.y(t))}`
  }
  // Kalın dip: hafif içe kavis, tabana doğru genişler
  d += ` Q${f(cx + g.r(0) + g.w * 0.6)} ${f(g.by - (g.by - g.yBot) * 0.3)} ${f(cx + g.rBase)} ${f(g.by)}`
  d += ` A${f(g.rBase)} ${f(g.rBase * k)} 0 0 1 ${f(cx - g.rBase)} ${f(g.by)}`
  d += ` Q${f(cx - g.r(0) - g.w * 0.6)} ${f(g.by - (g.by - g.yBot) * 0.3)} ${f(cx - g.r(0) - g.w)} ${f(g.yBot)}`
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    d += ` L${f(cx - g.r(t) - g.w)} ${f(g.y(t))}`
  }
  return d + 'Z'
}

/** Sıvı silüeti: dip ön yayı + yanlar + yüzey elipsinin arka yarısı. */
function liquidPath(g, level, steps = 30) {
  const k = GLASS_K
  const { cx } = g
  const rl = g.r(level)
  const r0 = g.r(0)
  let d = `M${f(cx - rl)} ${f(g.y(level))} A${f(rl)} ${f(rl * k)} 0 0 1 ${f(cx + rl)} ${f(g.y(level))}`
  for (let i = steps; i >= 0; i--) {
    const t = (i / steps) * level
    d += ` L${f(cx + g.r(t))} ${f(g.y(t))}`
  }
  d += ` A${f(r0)} ${f(r0 * k)} 0 0 1 ${f(cx - r0)} ${f(g.yBot)}`
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * level
    d += ` L${f(cx - g.r(t))} ${f(g.y(t))}`
  }
  return d + 'Z'
}

/** Profili izleyen şerit (rel: yarıçap oranı, işaretli: - sol). Dolgu için kapalı yol: rel0 → rel1. */
function bandPath(g, rel0, rel1, t0, t1, steps = 30) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps
    d += `${i === 0 ? 'M' : 'L'}${f(g.cx + (g.r(t) + g.w) * rel0)} ${f(g.y(t))}`
  }
  for (let i = steps; i >= 0; i--) {
    const t = t0 + ((t1 - t0) * i) / steps
    d += ` L${f(g.cx + (g.r(t) + g.w) * rel1)} ${f(g.y(t))}`
  }
  return d + 'Z'
}

/** Profili izleyen parlama çizgisi (rel: yarıçapın oranı, işaretli: - sol). */
function profileLine(g, rel, t0, t1, steps = 24) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps
    const x = g.cx + (g.r(t) + g.w * 0.5) * rel
    d += `${i === 0 ? 'M' : 'L'}${f(x)} ${f(g.y(t))}`
  }
  return d
}

/** Tavşan kanı varsayılan çay rengi. */
export const TEA = '#C2401A'

/**
 * Çay bardağı.
 * opts: fill (0..1 seviye), tea (renk), sw (kontur), saucer (tabaklı), spoon (kaşık), glass (cam tonu),
 *       rim (ağız rengi), outline, decal (bardağa kırpılmış ek SVG), steam (buhar), shadow (zemin gölgesi)
 */
export function teaGlass(cx, by, h, opts = {}) {
  const {
    fill = 0.84,
    tea = TEA,
    sw = Math.max(2.5, h * 0.03),
    saucer = false,
    spoon = false,
    glass = '#E4F5FA',
    rim = '#FFFFFF',
    outline = C.out,
    decal = '',
    steam = false,
    shadow = true,
    cracked = false,
  } = opts
  const g = glassGeom(cx, by, h)
  const k = GLASS_K
  let s = ''

  if (saucer) s += saucerSvg(cx, by + h * 0.012, g.rTop * 1.75, { sw, shadow })
  else if (shadow) s += `<ellipse cx="${f(cx)}" cy="${f(by + h * 0.012)}" rx="${f(g.rBase * 1.4)}" ry="${f(g.rBase * 0.34)}" fill="#2A1408" opacity=".25"/>`

  const outer = outerPath(g)
  const cid = newId('gc')
  s += `<clipPath id="${cid}"><path d="${outer}"/></clipPath>`

  // Cam gövde: düz, açık mavimsi beyaz
  s += `<path d="${outer}" fill="${glass}" opacity=".62"/>`
  // Ağzın arka yarısı (iç kenar)
  const ri = g.rTop - g.w
  s += `<path d="M${f(cx - ri)} ${f(g.yTop)} A${f(ri)} ${f(ri * k)} 0 0 1 ${f(cx + ri)} ${f(g.yTop)}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.5)}" opacity=".5"/>`

  s += `<g clip-path="url(#${cid})">`
  // Çay: düz renk + sağda koyu bant + solda ince açık bant
  if (fill > 0.01) {
    const lvl = Math.min(0.995, fill)
    const lp = liquidPath(g, lvl)
    const tid = newId('tc')
    s += `<clipPath id="${tid}"><path d="${lp}"/></clipPath>`
    s += `<path d="${lp}" fill="${tea}"/>`
    s += `<g clip-path="url(#${tid})">`
    s += `<path d="${bandPath(g, 0.42, 1.2, -0.1, 1.05)}" fill="${shade(tea, 0.72)}"/>`
    s += `<path d="${bandPath(g, -0.78, -0.6, -0.1, 1.05)}" fill="${mix(tea, '#FFC27A', 0.35)}"/>`
    s += `</g>`
    // Yüzey
    const rl = g.r(lvl)
    const yl = g.y(lvl)
    s += `<path d="${ellipsePath(cx, yl, rl, rl * k)}" fill="${mix(tea, '#FFB45C', 0.5)}" stroke="${shade(tea, 0.55)}" stroke-width="${f(sw * 0.45)}"/>`
    s += `<ellipse cx="${f(cx - rl * 0.38)}" cy="${f(yl - rl * k * 0.1)}" rx="${f(rl * 0.26)}" ry="${f(rl * k * 0.34)}" fill="#fff" opacity=".55"/>`
  }

  // Kalın cam dip: düz açık ton + alt koyu bant
  const r0 = g.r(0) + g.w
  const baseD = `M${f(cx - r0)} ${f(g.yBot)} A${f(r0)} ${f(r0 * k)} 0 0 0 ${f(cx + r0)} ${f(g.yBot)} L${f(cx + g.rBase)} ${f(g.by)} A${f(g.rBase)} ${f(g.rBase * k)} 0 0 1 ${f(cx - g.rBase)} ${f(g.by)}Z`
  const baseTint = fill > 0.01 ? mix(glass, tea, 0.3) : shade(glass, 0.93)
  s += `<path d="${baseD}" fill="${baseTint}"/>`
  s += `<path d="M${f(cx - g.rBase)} ${f(g.by)} A${f(g.rBase)} ${f(g.rBase * k)} 0 0 0 ${f(cx + g.rBase)} ${f(g.by)} L${f(cx + g.rBase)} ${f(g.by - (g.by - g.yBot) * 0.35)} A${f(g.rBase)} ${f(g.rBase * k)} 0 0 1 ${f(cx - g.rBase)} ${f(g.by - (g.by - g.yBot) * 0.35)}Z" fill="${shade(baseTint, 0.82)}"/>`
  s += `<path d="M${f(cx - r0)} ${f(g.yBot)} A${f(r0)} ${f(r0 * k)} 0 0 0 ${f(cx + r0)} ${f(g.yBot)}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.5)}" opacity=".55"/>`
  s += decal
  // Sağda tek ton gölge bandı (cam + çay birlikte)
  s += `<path d="${bandPath(g, 0.62, 1.3, -0.2, 1.05)}" fill="#1D4A5C" opacity=".14"/>`
  // Parlamalar: solda uzun kalın şerit + altında kısa kapsül, sağda kısa ince çizgi, dipte yay
  s += `<path d="${profileLine(g, -0.66, 0.34, 0.9)}" fill="none" stroke="#fff" stroke-width="${f(g.ih * 0.075)}" stroke-linecap="round" opacity=".95"/>`
  s += `<path d="${profileLine(g, -0.7, 0.1, 0.22)}" fill="none" stroke="#fff" stroke-width="${f(g.ih * 0.06)}" stroke-linecap="round" opacity=".9"/>`
  s += `<path d="${profileLine(g, 0.74, 0.66, 0.86)}" fill="none" stroke="#fff" stroke-width="${f(g.ih * 0.032)}" stroke-linecap="round" opacity=".85"/>`
  s += `<path d="M${f(cx - r0 * 0.62)} ${f(g.yBot + (g.by - g.yBot) * 0.55)} Q${f(cx - r0 * 0.2)} ${f(g.by + g.rBase * k * 0.2)} ${f(cx + r0 * 0.2)} ${f(g.yBot + (g.by - g.yBot) * 0.72)}" fill="none" stroke="#fff" stroke-width="${f(sw * 0.8)}" stroke-linecap="round" opacity=".85"/>`
  s += `</g>`

  if (cracked) {
    s += `<path d="M${f(cx - g.r(0.8) * 0.2)} ${f(g.y(0.95))} L${f(cx + g.r(0.7) * 0.15)} ${f(g.y(0.7))} L${f(cx - g.r(0.5) * 0.1)} ${f(g.y(0.52))} L${f(cx + g.r(0.3) * 0.3)} ${f(g.y(0.3))}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.7)}" stroke-linejoin="round"/>`
  }

  // Kontur
  s += `<path d="${outer}" fill="none" stroke="${outline}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`
  // Ağız: kalın beyaz ön dudak + tam elips kontur + parıltı
  const rr = g.rTop - g.w * 0.5
  s += `<path d="M${f(cx - rr)} ${f(g.yTop)} A${f(rr)} ${f(rr * k)} 0 0 0 ${f(cx + rr)} ${f(g.yTop)}" fill="none" stroke="${rim}" stroke-width="${f(Math.max(sw * 1.2, g.w * 1.2))}"/>`
  s += `<path d="${ellipsePath(cx, g.yTop, g.rTop, g.rTop * k)}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.9)}"/>`
  s += `<ellipse cx="${f(cx - g.rTop * 0.5)}" cy="${f(g.yTop + g.rTop * k * 0.62)}" rx="${f(g.rTop * 0.16)}" ry="${f(g.rTop * k * 0.26)}" fill="#fff"/>`

  if (saucer && spoon) s += spoonSvg(cx + g.rTop * 1.2, by + g.rTop * 0.1, g.rTop * 1.5, sw)

  if (steam) {
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * g.rTop * 0.45
      const y0 = g.yTop - g.rTop * 0.35
      s += `<path d="M${f(x)} ${f(y0)} q${f(-g.rTop * 0.25)} ${f(-g.ih * 0.12)} 0 ${f(-g.ih * 0.24)} t0 ${f(-g.ih * 0.22)}" fill="none" stroke="#fff" stroke-width="${f(sw * 1.3)}" stroke-linecap="round" opacity="${0.8 - i * 0.12}"/>`
    }
  }
  return s
}

/** Çay tabağı: düz renkli cartoon porselen, kırmızı kenar bandı, ince altın çizgi. (cx, cy) tabak üst yüzü ortası. */
export function saucerSvg(cx, cy, rx, opts = {}) {
  const { sw = 4, shadow = true, band = '#D23B2B', gold = '#F2C14E' } = opts
  const k = GLASS_K
  const ry = rx * k
  const depth = rx * 0.11
  let s = ''
  if (shadow) s += `<ellipse cx="${f(cx)}" cy="${f(cy + depth * 1.3)}" rx="${f(rx * 1.06)}" ry="${f(ry * 1.08)}" fill="#2A1408" opacity=".25"/>`
  // Alt kenar (kalınlık)
  s += `<path d="M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(cy)} L${f(cx + rx * 0.96)} ${f(cy + depth)} A${f(rx * 0.96)} ${f(ry * 0.96)} 0 0 1 ${f(cx - rx * 0.96)} ${f(cy + depth)}Z" fill="${shade(band, 0.75)}" stroke="${C.out}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`
  // Üst yüz: kırmızı kenar + beyaz iç
  s += `<path d="${ellipsePath(cx, cy, rx, ry)}" fill="${band}" stroke="${C.out}" stroke-width="${f(sw)}"/>`
  s += `<path d="${ellipsePath(cx, cy + ry * 0.03, rx * 0.84, ry * 0.84)}" fill="#FFFFFF"/>`
  s += `<path d="${ellipsePath(cx, cy + ry * 0.03, rx * 0.78, ry * 0.78)}" fill="none" stroke="${gold}" stroke-width="${f(rx * 0.02)}"/>`
  // İç gölge (sağ alt) ve göz (bardağın oturduğu çukur)
  s += `<path d="M${f(cx + rx * 0.84)} ${f(cy + ry * 0.03)} A${f(rx * 0.84)} ${f(ry * 0.84)} 0 0 1 ${f(cx - rx * 0.3)} ${f(cy + ry * 0.83)} A${f(rx * 0.7)} ${f(ry * 0.6)} 0 0 0 ${f(cx + rx * 0.84)} ${f(cy + ry * 0.03)}Z" fill="#DCE4EA"/>`
  s += `<path d="${ellipsePath(cx, cy + ry * 0.04, rx * 0.46, ry * 0.46)}" fill="#EEF2F5" stroke="#C3CDD6" stroke-width="${f(sw * 0.5)}"/>`
  s += `<ellipse cx="${f(cx - rx * 0.52)}" cy="${f(cy - ry * 0.4)}" rx="${f(rx * 0.17)}" ry="${f(ry * 0.13)}" fill="#fff" stroke="${band}" stroke-opacity="0" />`
  s += `<path d="M${f(cx - rx * 0.92)} ${f(cy - ry * 0.12)} A${f(rx * 0.92)} ${f(ry * 0.92)} 0 0 1 ${f(cx - rx * 0.45)} ${f(cy - ry * 0.82)}" fill="none" stroke="#fff" stroke-width="${f(sw * 0.7)}" stroke-linecap="round" opacity=".8"/>`
  return s
}

/** Çay kaşığı (tabağın sağında, yatık). (x, y): sap ucu ile çanak arası orta. len: toplam boy. */
export function spoonSvg(x, y, len, sw = 4) {
  const bowlR = len * 0.13
  const bx = x - len * 0.32
  const by = y + len * 0.02
  const hx = x + len * 0.45
  const hy = y - len * 0.16
  const metal = '#D5DCE2'
  let s = ''
  s += `<path d="M${f(bx + bowlR * 0.6)} ${f(by - bowlR * 0.2)} L${f(hx)} ${f(hy)} L${f(hx + len * 0.02)} ${f(hy + len * 0.035)} L${f(bx + bowlR * 0.7)} ${f(by + bowlR * 0.25)}Z" fill="${metal}" stroke="${C.out}" stroke-width="${f(sw * 0.8)}" stroke-linejoin="round"/>`
  s += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(bowlR)}" ry="${f(bowlR * 0.62)}" transform="rotate(-14 ${f(bx)} ${f(by)})" fill="${metal}" stroke="${C.out}" stroke-width="${f(sw * 0.8)}"/>`
  s += `<ellipse cx="${f(bx + bowlR * 0.25)}" cy="${f(by + bowlR * 0.15)}" rx="${f(bowlR * 0.55)}" ry="${f(bowlR * 0.3)}" transform="rotate(-14 ${f(bx)} ${f(by)})" fill="#A9B4BE"/>`
  s += `<ellipse cx="${f(bx - bowlR * 0.3)}" cy="${f(by - bowlR * 0.2)}" rx="${f(bowlR * 0.35)}" ry="${f(bowlR * 0.18)}" transform="rotate(-14 ${f(bx)} ${f(by)})" fill="#fff"/>`
  return s
}
