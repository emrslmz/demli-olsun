// Gerçek oranlı ince belli çay bardağı (SVG). Oyundaki bardakla (src/core/glassModel.ts) aynı iç profil:
// yuvarlak alt göbek, dar bel, hafif açılan ağız, kalın cam dip. Yükseklik/ağız çapı ≈ 1,8.
// İkonlarda, raflarda, logoda ve rozetlerde bu çizim kullanılır.

import { C, ellipsePath, f, mix, newId, shade } from './svg.mjs'
import { lg } from './toon.mjs'

export const GLASS_K = 0.26
/** İç profil [h, r] — iç yükseklik birimiyle (glassModel.ts ile aynı). */
export const INCE_PROFILE = [
  [0, 0.178],
  [0.05, 0.23],
  [0.12, 0.259],
  [0.2, 0.265],
  [0.3, 0.248],
  [0.4, 0.214],
  [0.48, 0.2],
  [0.57, 0.206],
  [0.7, 0.232],
  [0.85, 0.261],
  [1, 0.283],
]
export const INCE_WALL = 0.022
export const INCE_BASE = 0.085

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
  return { cx, by, h, ih, yBot, yTop: y(1), y, r, w, rTop: r(1) + w, rBase: (r(0) + w) * 1.02 }
}

function outerPath(g, steps = 40) {
  const k = GLASS_K
  const { cx } = g
  let d = `M${f(cx - g.rTop)} ${f(g.yTop)} A${f(g.rTop)} ${f(g.rTop * k)} 0 0 1 ${f(cx + g.rTop)} ${f(g.yTop)}`
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    d += ` L${f(cx + g.r(t) + g.w)} ${f(g.y(t))}`
  }
  // Kalın dip: hafif içe kavis
  d += ` Q${f(cx + g.r(0) + g.w * 1.6)} ${f(g.by - (g.by - g.yBot) * 0.2)} ${f(cx + g.rBase)} ${f(g.by)}`
  d += ` A${f(g.rBase)} ${f(g.rBase * k)} 0 0 1 ${f(cx - g.rBase)} ${f(g.by)}`
  d += ` Q${f(cx - g.r(0) - g.w * 1.6)} ${f(g.by - (g.by - g.yBot) * 0.2)} ${f(cx - g.r(0) - g.w)} ${f(g.yBot)}`
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
export const TEA = '#B23A12'

/**
 * Çay bardağı.
 * opts: fill (0..1 seviye), tea (renk), sw (kontur), saucer (tabaklı), spoon (kaşık), glass (cam tonu),
 *       rim (ağız rengi), outline, decal (bardağa kırpılmış ek SVG), steam (buhar), shadow (zemin gölgesi)
 */
export function teaGlass(cx, by, h, opts = {}) {
  const {
    fill = 0.84,
    tea = TEA,
    sw = Math.max(2.5, h * 0.022),
    saucer = false,
    spoon = false,
    glass = '#DDF3F7',
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

  if (saucer) s += saucerSvg(cx, by + h * 0.012, g.rTop * 1.85, { sw, shadow })
  else if (shadow) s += `<ellipse cx="${f(cx)}" cy="${f(by + h * 0.01)}" rx="${f(g.rBase * 1.35)}" ry="${f(g.rBase * 0.36)}" fill="#2A1408" opacity=".28" filter="url(#b4)"/>`

  const outer = outerPath(g)
  const cid = newId('gc')
  s += `<clipPath id="${cid}"><path d="${outer}"/></clipPath>`

  // Arka ağız (camın arkasından görünür)
  s += `<path d="M${f(cx - g.rTop + g.w)} ${f(g.yTop)} A${f(g.rTop - g.w)} ${f((g.rTop - g.w) * k)} 0 0 1 ${f(cx + g.rTop - g.w)} ${f(g.yTop)}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.55)}" opacity=".45"/>`

  // Cam gövde: kenarlarda daha dolu, ortada şeffaf
  const [gg, ggd] = lg(
    [
      [0, glass, 0.85],
      [0.22, glass, 0.35],
      [0.55, '#FFFFFF', 0.12],
      [0.85, glass, 0.4],
      [1, shade(glass, 0.85), 0.85],
    ],
    0,
    0,
    1,
    0,
  )
  s += ggd + `<path d="${outer}" fill="url(#${gg})"/>`

  // Çay
  if (fill > 0.01) {
    const lvl = Math.min(0.995, fill)
    const lp = liquidPath(g, lvl)
    const [tg, tgd] = lg(
      [
        [0, shade(tea, 0.62)],
        [0.25, shade(tea, 0.95)],
        [0.48, mix(tea, '#FFB25C', 0.28)],
        [0.72, tea],
        [1, shade(tea, 0.55)],
      ],
      0,
      0,
      1,
      0,
    )
    const [vg, vgd] = lg(
      [
        [0, '#000', 0],
        [0.7, '#000', 0.08],
        [1, '#000', 0.32],
      ],
      0,
      0,
      0,
      1,
    )
    s += tgd + vgd + `<path d="${lp}" fill="url(#${tg})"/><path d="${lp}" fill="url(#${vg})"/>`
    // Yüzey
    const rl = g.r(lvl)
    const yl = g.y(lvl)
    s += `<path d="${ellipsePath(cx, yl, rl, rl * k)}" fill="${mix(tea, '#FF9A4A', 0.45)}" stroke="${shade(tea, 0.6)}" stroke-width="${f(sw * 0.35)}"/>`
    s += `<ellipse cx="${f(cx - rl * 0.35)}" cy="${f(yl - rl * k * 0.15)}" rx="${f(rl * 0.32)}" ry="${f(rl * k * 0.32)}" fill="#fff" opacity=".45"/>`
  }

  // Kalın cam dip
  const r0 = g.r(0) + g.w
  const baseD = `M${f(cx - r0)} ${f(g.yBot)} A${f(r0)} ${f(r0 * k)} 0 0 0 ${f(cx + r0)} ${f(g.yBot)} L${f(cx + g.rBase)} ${f(g.by)} A${f(g.rBase)} ${f(g.rBase * k)} 0 0 1 ${f(cx - g.rBase)} ${f(g.by)}Z`
  const baseTint = fill > 0.01 ? mix(glass, tea, 0.22) : glass
  s += `<g clip-path="url(#${cid})"><path d="${baseD}" fill="${baseTint}" opacity=".9"/>`
  s += `<path d="M${f(cx - r0 * 0.7)} ${f(g.yBot + (g.by - g.yBot) * 0.45)} Q${f(cx)} ${f(g.by + g.rBase * k * 0.4)} ${f(cx + r0 * 0.55)} ${f(g.yBot + (g.by - g.yBot) * 0.5)}" fill="none" stroke="#fff" stroke-width="${f(sw * 0.9)}" stroke-linecap="round" opacity=".75"/>`
  s += decal
  // Parlamalar: solda uzun keskin şerit + kısa nokta, sağda ince çizgi
  s += `<path d="${profileLine(g, -0.62, 0.1, 0.9)}" fill="none" stroke="#fff" stroke-width="${f(g.ih * 0.055)}" stroke-linecap="round" opacity=".75"/>`
  s += `<path d="${profileLine(g, -0.4, 0.62, 0.84)}" fill="none" stroke="#fff" stroke-width="${f(g.ih * 0.025)}" stroke-linecap="round" opacity=".6"/>`
  s += `<path d="${profileLine(g, 0.8, 0.18, 0.78)}" fill="none" stroke="#fff" stroke-width="${f(g.ih * 0.02)}" stroke-linecap="round" opacity=".45"/>`
  s += `</g>`

  if (cracked) {
    s += `<path d="M${f(cx - g.r(0.8) * 0.2)} ${f(g.y(0.95))} L${f(cx + g.r(0.7) * 0.15)} ${f(g.y(0.7))} L${f(cx - g.r(0.5) * 0.1)} ${f(g.y(0.52))} L${f(cx + g.r(0.3) * 0.3)} ${f(g.y(0.3))}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.7)}" stroke-linejoin="round"/>`
  }

  // Kontur
  s += `<path d="${outer}" fill="none" stroke="${outline}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`
  // Dip iç elipsi
  s += `<path d="M${f(cx - g.r(0))} ${f(g.yBot)} A${f(g.r(0))} ${f(g.r(0) * k)} 0 0 0 ${f(cx + g.r(0))} ${f(g.yBot)}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.45)}" opacity=".45"/>`
  // Ağız: ön dudak (kalın, parlak) + kontur
  const rr = g.rTop - g.w * 0.5
  s += `<path d="M${f(cx - rr)} ${f(g.yTop)} A${f(rr)} ${f(rr * k)} 0 0 0 ${f(cx + rr)} ${f(g.yTop)}" fill="none" stroke="${rim}" stroke-width="${f(Math.max(sw * 1.1, g.w * 1.3))}" opacity="${rim === '#FFFFFF' ? 0.85 : 1}"/>`
  s += `<path d="${ellipsePath(cx, g.yTop, g.rTop, g.rTop * k)}" fill="none" stroke="${outline}" stroke-width="${f(sw * 0.85)}"/>`
  s += `<ellipse cx="${f(cx - g.rTop * 0.55)}" cy="${f(g.yTop + g.rTop * k * 0.55)}" rx="${f(g.rTop * 0.18)}" ry="${f(g.rTop * k * 0.28)}" fill="#fff" opacity=".9"/>`

  if (saucer && spoon) s += spoonSvg(cx + g.rTop * 1.25, by + g.rTop * 0.1, g.rTop * 1.5, sw)

  if (steam) {
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * g.rTop * 0.45
      const y0 = g.yTop - g.rTop * 0.35
      s += `<path d="M${f(x)} ${f(y0)} q${f(-g.rTop * 0.25)} ${f(-g.ih * 0.12)} 0 ${f(-g.ih * 0.24)} t0 ${f(-g.ih * 0.22)}" fill="none" stroke="#fff" stroke-width="${f(sw * 1.4)}" stroke-linecap="round" opacity="${0.55 - i * 0.08}" filter="url(#b2)"/>`
    }
  }
  return s
}

/** Çay tabağı: beyaz porselen, kırmızı-altın kenar, istenirse kaşık. (cx, cy) tabak üst yüzü ortası. */
export function saucerSvg(cx, cy, rx, opts = {}) {
  const { sw = 4, shadow = true, band = '#C0392B', gold = '#E2B33C' } = opts
  const k = GLASS_K
  const ry = rx * k
  const depth = rx * 0.1
  let s = ''
  if (shadow) s += `<ellipse cx="${f(cx)}" cy="${f(cy + depth * 1.4)}" rx="${f(rx * 1.04)}" ry="${f(ry * 1.05)}" fill="#2A1408" opacity=".3" filter="url(#b8)"/>`
  // Alt kenar (kalınlık)
  s += `<path d="M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(cy)} L${f(cx + rx * 0.97)} ${f(cy + depth)} A${f(rx * 0.97)} ${f(ry * 0.97)} 0 0 1 ${f(cx - rx * 0.97)} ${f(cy + depth)}Z" fill="#D9DEE4" stroke="${C.out}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`
  const [pg, pgd] = lg(
    [
      [0, '#FFFFFF'],
      [0.6, '#F4F5F2'],
      [1, '#DCE1E6'],
    ],
    0.2,
    0,
    0.8,
    1,
  )
  s += pgd + `<path d="${ellipsePath(cx, cy, rx, ry)}" fill="url(#${pg})" stroke="${C.out}" stroke-width="${f(sw)}"/>`
  // Kenar bantları
  s += `<path d="${ellipsePath(cx, cy, rx * 0.9, ry * 0.9)}" fill="none" stroke="${band}" stroke-width="${f(rx * 0.06)}"/>`
  s += `<path d="${ellipsePath(cx, cy, rx * 0.84, ry * 0.84)}" fill="none" stroke="${gold}" stroke-width="${f(rx * 0.018)}"/>`
  // Göz (bardağın oturduğu çukur)
  s += `<path d="${ellipsePath(cx, cy + ry * 0.04, rx * 0.5, ry * 0.5)}" fill="#E8ECEF" stroke="#C9D0D7" stroke-width="${f(sw * 0.5)}"/>`
  s += `<ellipse cx="${f(cx - rx * 0.5)}" cy="${f(cy - ry * 0.45)}" rx="${f(rx * 0.2)}" ry="${f(ry * 0.14)}" fill="#fff" opacity=".9"/>`
  return s
}

/** Çay kaşığı (tabağın sağında, yatık). (x, y): sap ucu ile çanak arası orta. len: toplam boy. */
export function spoonSvg(x, y, len, sw = 4) {
  const bowlR = len * 0.13
  const bx = x - len * 0.32
  const by = y + len * 0.02
  const hx = x + len * 0.45
  const hy = y - len * 0.16
  const [mg, mgd] = lg(
    [
      [0, '#FFFFFF'],
      [0.5, '#C9D1D8'],
      [1, '#8E9AA6'],
    ],
    0,
    0,
    0,
    1,
  )
  let s = mgd
  s += `<path d="M${f(bx + bowlR * 0.6)} ${f(by - bowlR * 0.2)} L${f(hx)} ${f(hy)} L${f(hx + len * 0.02)} ${f(hy + len * 0.035)} L${f(bx + bowlR * 0.7)} ${f(by + bowlR * 0.25)}Z" fill="url(#${mg})" stroke="${C.out}" stroke-width="${f(sw * 0.8)}" stroke-linejoin="round"/>`
  s += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(bowlR)}" ry="${f(bowlR * 0.62)}" transform="rotate(-14 ${f(bx)} ${f(by)})" fill="url(#${mg})" stroke="${C.out}" stroke-width="${f(sw * 0.8)}"/>`
  s += `<ellipse cx="${f(bx - bowlR * 0.3)}" cy="${f(by - bowlR * 0.2)}" rx="${f(bowlR * 0.35)}" ry="${f(bowlR * 0.18)}" transform="rotate(-14 ${f(bx)} ${f(by)})" fill="#fff" opacity=".9"/>`
  return s
}
