// Ortak SVG yardımcıları — stil bloğu:
// Kalın, temiz koyu kahve kontur (#3B2416), dış silüette daha kalın. Düz cel gölge + tek yumuşak parlama (ışık sol üstten).
// Sıcak, doygun İznik + eski Türk sineması afiş paleti. Yazı, harf, logo yok.

export const C = {
  out: '#3B2416',
  cobalt: '#1F4E8C',
  turq: '#1E9AA8',
  tea: '#8B1E0F',
  brass: '#C9A227',
  walnut: '#3B2416',
  cream: '#F3E6C8',
  paper: '#F6EBCF',
  white: '#FFFFFF',
  chalk: '#EDEDE4',
  board: '#1E2B24',
  gold: '#E2B33C',
  red: '#C0392B',
  green: '#4E9A3A',
  steel: '#AEB8C2',
  copper: '#C0703A',
  pink: '#F28B82',
}

let uid = 0
export function newId(p = 'i') {
  uid += 1
  return `${p}${uid}`
}

const FILTERS = `
  <filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="b14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="b24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
`

export function svg(w, h, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${FILTERS}${defs}</defs>${body}</svg>`
}

// ---------- Renk ----------

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHex([r, g, b]) {
  const c = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
/** f<1 koyulaştırır, f>1 açar. Gölge tonu hafif sıcağa kayar. */
export function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex)
  if (f <= 1) return rgbToHex([r * f, g * f * 0.97, b * f * 0.92])
  const t = f - 1
  return rgbToHex([r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t])
}
export function mix(a, b, t) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t])
}

// ---------- Şekiller ----------

export const f = (n) => Math.round(n * 10) / 10

export function ellipsePath(cx, cy, rx, ry) {
  return `M${f(cx - rx)} ${f(cy)} a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`
}

export function rrectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`
}

/** Noktalardan kapalı yumuşak yol (Catmull-Rom → Bezier). */
export function smoothPath(pts, closed = true, tension = 0.5) {
  const n = pts.length
  if (n < 2) return ''
  const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1)
    const p1 = P(i)
    const p2 = P(i + 1)
    const p3 = P(i + 2)
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3]
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return closed ? d + 'Z' : d
}

/** Yıldız / çok köşeli. */
export function starPath(cx, cy, rOut, rIn, points = 5, rot = -Math.PI / 2) {
  const pts = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn
    const a = rot + (i * Math.PI) / points
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'
}

// ---------- Cel gölgeli şekil ----------

/**
 * Düz renk + alt-sağda tek ton cel gölge + sol üstte tek yumuşak parlama + kontur.
 * opts.hl: [cx, cy, rx, ry] parlama elipsi (yoksa çizilmez)
 * opts.shadow: gölge tonu çarpanı, opts.off: [dx, dy] gölge kayması (px)
 * opts.inner: şekle kırpılmış ek içerik (desen vb.)
 */
export function cel(d, fill, opts = {}) {
  const { sw = 6, shadow = 0.8, off = [10, 10], hl = null, hlOpacity = 0.4, stroke = C.out, inner = '', noShadow = false, fillRule } = opts
  const cid = newId('cl')
  const fr = fillRule ? ` fill-rule="${fillRule}" clip-rule="${fillRule}"` : ''
  const shadowFill = shade(fill, shadow)
  let s = `<clipPath id="${cid}"><path d="${d}"${fr}/></clipPath>`
  if (noShadow) {
    s += `<path d="${d}" fill="${fill}"${fr}/>`
  } else {
    s += `<path d="${d}" fill="${shadowFill}"${fr}/>`
    s += `<g clip-path="url(#${cid})"><path d="${d}" fill="${fill}" transform="translate(${-off[0]} ${-off[1]})"${fr}/></g>`
  }
  if (inner || hl) {
    s += `<g clip-path="url(#${cid})">${inner}`
    if (hl) s += `<ellipse cx="${f(hl[0])}" cy="${f(hl[1])}" rx="${f(hl[2])}" ry="${f(hl[3])}" fill="#fff" opacity="${hlOpacity}" filter="url(#b8)"/>`
    s += `</g>`
  }
  if (sw > 0) s += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${fr}/>`
  return s
}

/** Dış silüet için kalın kontur katmanı: parçaların yollarını kalın çizer (önce çizilir). */
export function silhouette(paths, width = 16, color = C.out) {
  return paths
    .map((d) => `<path d="${d}" fill="${color}" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>`)
    .join('')
}

export function line(d, w = 6, color = C.out, extra = '') {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
}

export function glow(cx, cy, r, color = '#fff', opacity = 0.5, blur = 'b14') {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${color}" opacity="${opacity}" filter="url(#${blur})"/>`
}

/** Hedef kutuya ölçekleyerek grup. */
export function fit(content, srcW, srcH, x, y, w, h) {
  const s = Math.min(w / srcW, h / srcH)
  const ox = x + (w - srcW * s) / 2
  const oy = y + (h - srcH * s) / 2
  return `<g transform="translate(${f(ox)} ${f(oy)}) scale(${s.toFixed(4)})">${content}</g>`
}

/** Seed'li basit RNG (görsellerde tekrar üretilebilir rastgelelik). */
export function rng(seed) {
  let a = 0
  for (let i = 0; i < String(seed).length; i++) a = (Math.imul(a ^ String(seed).charCodeAt(i), 2654435761) + 1) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
