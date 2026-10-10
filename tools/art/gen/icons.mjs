// v2 ikonlar (256×256, saydam): kalın kontur, parlak gradyan, keskin beyaz parlama.

import { register } from './index.mjs'
import { C, ellipsePath, f, rrectPath, shade, smoothPath, starPath, svg } from '../lib/svg.mjs'
import { contactShadow, lg, toon } from '../lib/toon.mjs'
import { teaGlass } from '../lib/teaGlass.mjs'

const S = 256
const OUT = C.out
const SW = 10

/** Eski API: tabaklı ince belli bardak (rozet, dekor). */
export function tulipGlass(cx, baseY, h, opts = {}) {
  return teaGlass(cx, baseY, h, { saucer: opts.saucer ?? false, tea: opts.tea, fill: opts.broken ? 0 : 0.84, cracked: !!opts.broken, shadow: false, sw: Math.max(4, h * 0.035) })
}

function coin() {
  let s = contactShadow(128, 232, 84, 12, 0.3)
  s += toon(ellipsePath(128, 136, 104, 104), '#C9971F', { sw: SW, band: [0, 0], rim: false })
  s += toon(ellipsePath(122, 126, 102, 102), '#F2C230', { sw: SW, band: [10, 10], light: 1.3, spec: [[78, 76, 26, 12, -40, 0.85]] })
  s += `<circle cx="122" cy="126" r="76" fill="none" stroke="#C9971F" stroke-width="8"/>`
  s += teaGlass(122, 182, 104, { fill: 0, shadow: false, sw: 7, glass: '#FFE38A', outline: '#9A6A10', rim: '#FFF3C0' }).replace(/opacity="\.45"/g, 'opacity=".2"')
  s += `<circle cx="168" cy="82" r="10" fill="#fff" opacity=".9"/>`
  return s
}

function life(broken) {
  if (broken)
    return `<g opacity=".55">${teaGlass(128, 226, 196, { saucer: true, fill: 0, cracked: true, sw: 9, glass: '#CFD6DB', shadow: false })}</g>`
  return teaGlass(128, 226, 196, { saucer: true, fill: 0.84, sw: 9, shadow: false })
}

function star(empty) {
  const d = starPath(128, 136, 112, 52, 5)
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 108 : 52
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push([128 + Math.cos(a) * r, 136 + Math.sin(a) * r])
  }
  const round = smoothPath(pts, true, 0.18)
  if (empty) return toon(round, '#8C8A86', { sw: SW, band: [8, 8], light: 1.1, rim: false }) + `<path d="${round}" fill="#3B2416" opacity=".15"/>`
  return toon(round, '#FFC93C', { sw: SW, band: [10, 10], light: 1.3, spec: [[96, 98, 20, 10, -30, 0.9]] }) + `<path d="${d}" fill="none"/>`
}

function sugar() {
  const p = (x, y) => `${f(x)} ${f(y)}`
  const top = `M${p(128, 30)} L${p(222, 72)} L${p(128, 114)} L${p(34, 72)}Z`
  const left = `M${p(34, 72)} L${p(128, 114)} L${p(128, 226)} L${p(34, 184)}Z`
  const right = `M${p(222, 72)} L${p(128, 114)} L${p(128, 226)} L${p(222, 184)}Z`
  return (
    contactShadow(128, 222, 100, 16, 0.3) +
    `<path d="${left}" fill="#EFEAE0"/><path d="${right}" fill="#D3CBBA"/><path d="${top}" fill="#FFFFFF"/>` +
    `<path d="M${p(64, 70)} L${p(124, 46)}" stroke="#fff" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="${top} ${left} ${right}" fill="none" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`
  )
}

function fire() {
  const d = `M128 18 C150 70 214 92 206 160 C200 214 160 238 128 238 C88 238 52 212 52 160 C52 118 80 104 92 64 C108 90 118 92 120 78 C122 60 116 40 128 18Z`
  const inner = `M128 108 C142 140 172 154 166 192 C162 218 146 228 128 228 C108 228 90 214 90 190 C90 166 108 158 114 132 C122 146 128 140 128 108Z`
  return toon(d, '#F2602A', { sw: SW, band: [8, 6], light: 1.2 }) + toon(inner, '#FFC93C', { sw: 0, band: null, rim: false, spec: [[112, 186, 8, 18, 0, 0.8]] })
}

function gift() {
  let s = contactShadow(128, 232, 96, 12, 0.3)
  s += toon(rrectPath(42, 110, 172, 118, 14), '#E8392F', { sw: SW, band: [10, 6], inner: `<rect x="112" y="100" width="32" height="140" fill="#FFC93C"/>` })
  s += toon(rrectPath(30, 80, 196, 48, 12), '#F2504A', { sw: SW, band: [0, 8], inner: `<rect x="108" y="70" width="40" height="70" fill="#FFC93C"/>`, spec: [[70, 92, 22, 6, 0, 0.7]] })
  for (const side of [-1, 1]) s += toon(`M128 82 C${128 + side * 20} 30 ${128 + side * 86} 34 ${128 + side * 66} 70 C${128 + side * 56} 88 ${128 + side * 26} 86 128 82Z`, '#FFC93C', { sw: SW - 2, band: [4, 4] })
  s += toon(ellipsePath(128, 80, 20, 16), '#F2B020', { sw: SW - 2, band: [3, 3], rim: false })
  return s
}

function lock() {
  let s = contactShadow(128, 234, 86, 12, 0.3)
  s += `<path d="M78 116 V82 a50 50 0 0 1 100 0 V116" fill="none" stroke="${OUT}" stroke-width="40" stroke-linecap="round"/><path d="M78 116 V82 a50 50 0 0 1 100 0 V116" fill="none" stroke="#B9C2CB" stroke-width="22" stroke-linecap="round"/>`
  s += toon(rrectPath(44, 108, 168, 120, 22), '#F2C230', { sw: SW, band: [10, 8], light: 1.25, spec: [[80, 130, 20, 8, 0, 0.8]] })
  s += `<circle cx="128" cy="158" r="16" fill="${OUT}"/><path d="M128 160 V196" stroke="${OUT}" stroke-width="14" stroke-linecap="round"/>`
  return s
}

function ad() {
  let s = contactShadow(128, 230, 100, 12, 0.3)
  s += toon(rrectPath(26, 52, 204, 150, 26), '#1F4E8C', { sw: SW, band: [8, 8], light: 1.3 })
  s += `<path d="${rrectPath(44, 68, 168, 118, 14)}" fill="#163A6A"/>`
  s += toon(`M108 92 L168 128 L108 164Z`, '#FFFFFF', { sw: SW - 2, band: [4, 4], rim: false, light: 1 })
  s += `<rect x="58" y="78" width="40" height="8" rx="4" fill="#fff" opacity=".35"/>`
  return s
}

function trophy() {
  let s = contactShadow(128, 236, 80, 12, 0.3)
  for (const side of [-1, 1]) s += `<path d="M${128 + side * 64} 66 q${side * 56} 0 ${side * 46} 48 q${-side * 8} 30 ${-side * 44} 36" fill="none" stroke="${OUT}" stroke-width="26" stroke-linecap="round"/><path d="M${128 + side * 64} 66 q${side * 56} 0 ${side * 46} 48 q${-side * 8} 30 ${-side * 44} 36" fill="none" stroke="#F2C230" stroke-width="12" stroke-linecap="round"/>`
  s += toon(`M58 40 H198 Q198 150 128 164 Q58 150 58 40Z`, '#F2C230', { sw: SW, band: [12, 6], light: 1.3, spec: [[90, 70, 12, 36, -8, 0.8]] })
  s += toon(rrectPath(112, 160, 32, 30, 6), '#D9A93A', { sw: SW - 2, band: [4, 0], rim: false })
  s += toon(rrectPath(70, 188, 116, 36, 10), '#8A5A33', { sw: SW, band: [0, 6] })
  s += `<path d="${starPath(128, 96, 30, 13, 5)}" fill="#FFF3C0" stroke="#C9971F" stroke-width="5"/>`
  return s
}

function share() {
  const pts = [
    [70, 128],
    [184, 62],
    [184, 194],
  ]
  let s = `<path d="M70 128 L184 62 M70 128 L184 194" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/><path d="M70 128 L184 62 M70 128 L184 194" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round"/>`
  for (const [x, y] of pts) s += toon(ellipsePath(x, y, 36, 36), '#1E9AA8', { sw: SW, band: [6, 6], spec: [[x - 12, y - 12, 9, 6, -30, 0.8]] })
  return s
}

function pause() {
  return [80, 152].map((x) => toon(rrectPath(x, 48, 48, 160, 18), '#FFF6E6', { sw: SW, band: [8, 6], light: 1, spec: [[x + 14, 80, 6, 18, 0, 0.8]] })).join('')
}

function gear() {
  const pts = []
  const n = 8
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2
    const r = i % 4 < 2 ? 108 : 84
    pts.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r])
  }
  const d = 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z ' + ellipsePath(128, 128, 38, 38)
  return toon(d, '#AEB8C2', { sw: SW, band: [8, 8], light: 1.3, fillRule: 'evenodd', spec: [[86, 76, 16, 7, -40, 0.8]] })
}

function shop() {
  let s = contactShadow(128, 234, 100, 12, 0.3)
  s += toon(rrectPath(46, 112, 164, 112, 10), '#C98A50', { sw: SW, band: [8, 6] })
  s += toon(rrectPath(70, 140, 116, 50, 8), '#5A3418', { sw: SW - 2, band: [0, 0], rim: false })
  for (const [x, c] of [
    [92, '#E8392F'],
    [128, '#4E9A3A'],
    [164, '#F2C230'],
  ])
    s += toon(ellipsePath(x, 160, 15, 15), c, { sw: 6, band: [3, 3], rim: false, spec: [[x - 5, 155, 4, 3, 0, 0.8]] })
  const awn = `M30 60 H226 L214 118 Q196 136 178 118 Q160 136 142 118 Q124 136 106 118 Q88 136 70 118 Q52 136 42 118Z`
  s += toon(awn, '#FFFFFF', {
    sw: SW,
    band: [0, 6],
    inner: [0, 1, 2].map((i) => `<rect x="${58 + i * 62}" y="50" width="31" height="100" fill="#E8392F"/>`).join(''),
  })
  return s
}

function music() {
  let s = `<path d="M100 186 V60 L196 40 V160" fill="none" stroke="${OUT}" stroke-width="30" stroke-linejoin="round"/><path d="M100 186 V60 L196 40 V160" fill="none" stroke="#FFF6E6" stroke-width="14" stroke-linejoin="round"/>`
  for (const [x, y] of [
    [74, 190],
    [170, 166],
  ])
    s += toon(ellipsePath(x, y, 34, 26), '#FFF6E6', { sw: SW, band: [5, 5], light: 1 })
  return s
}

function sfx() {
  let s = toon(`M40 100 H84 L140 54 V202 L84 156 H40Z`, '#FFF6E6', { sw: SW, band: [8, 6], light: 1 })
  for (const r of [40, 72]) s += `<path d="M${150 + r * 0.3} ${128 - r} q${r} ${r} 0 ${r * 2}" fill="none" stroke="${OUT}" stroke-width="22" stroke-linecap="round"/><path d="M${150 + r * 0.3} ${128 - r} q${r} ${r} 0 ${r * 2}" fill="none" stroke="#FFF6E6" stroke-width="10" stroke-linecap="round"/>`
  return s
}

function vibration() {
  let s = toon(rrectPath(84, 34, 88, 188, 18), '#1E9AA8', { sw: SW, band: [8, 6], inner: `<rect x="98" y="54" width="60" height="130" rx="6" fill="#BFF0F4"/>` })
  for (const side of [-1, 1]) s += `<path d="M${128 + side * 66} 84 l${side * 16} 22 l${-side * 16} 22 l${side * 16} 22" fill="none" stroke="${OUT}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`
  return s
}

function back() {
  const d = `M36 128 L118 52 V96 H214 V160 H118 V204Z`
  return toon(d, '#FFF6E6', { sw: SW + 2, band: [8, 6], light: 1, spec: [[150, 112, 40, 6, 0, 0.6]] })
}

function close() {
  return toon(`M70 48 L128 106 L186 48 L208 70 L150 128 L208 186 L186 208 L128 150 L70 208 L48 186 L106 128 L48 70Z`, '#E8392F', {
    sw: SW,
    band: [8, 6],
    light: 1.3,
  })
}

function clock() {
  let s = toon(ellipsePath(128, 132, 100, 100), '#F2C230', { sw: SW, band: [8, 8], light: 1.3 })
  s += `<circle cx="128" cy="132" r="78" fill="#FFF8E7" stroke="${OUT}" stroke-width="7"/>`
  s += `<path d="M128 132 V80 M128 132 L164 150" stroke="${OUT}" stroke-width="12" stroke-linecap="round"/><circle cx="128" cy="132" r="9" fill="#E8392F" stroke="${OUT}" stroke-width="4"/>`
  return s
}

function info() {
  let s = toon(ellipsePath(128, 128, 104, 104), '#1F4E8C', { sw: SW, band: [8, 8], light: 1.35, spec: [[80, 76, 22, 10, -40, 0.7]] })
  s += `<circle cx="128" cy="80" r="16" fill="#fff"/><rect x="112" y="108" width="32" height="88" rx="12" fill="#fff"/>`
  return s
}

function dem() {
  let s = contactShadow(120, 222, 86, 12, 0.3)
  const body = smoothPath([
    [64, 112],
    [70, 190],
    [120, 214],
    [170, 190],
    [176, 112],
    [120, 92],
  ])
  s += `<path d="M168 136 Q238 120 232 64" fill="none" stroke="${OUT}" stroke-width="26" stroke-linecap="round"/><path d="M168 136 Q238 120 232 64" fill="none" stroke="#C0392B" stroke-width="12" stroke-linecap="round"/>`
  s += `<path d="M70 130 q-44 10 -30 50 q8 20 36 18" fill="none" stroke="${OUT}" stroke-width="24"/><path d="M70 130 q-44 10 -30 50 q8 20 36 18" fill="none" stroke="#C0392B" stroke-width="10"/>`
  s += toon(body, '#C0392B', { sw: SW, band: [10, 8], light: 1.3, spec: [[92, 136, 12, 24, -10, 0.8]] })
  s += toon(ellipsePath(120, 100, 52, 16), '#A52F22', { sw: SW - 2, band: [0, 4], rim: false })
  s += toon(ellipsePath(120, 80, 16, 14), '#E2B33C', { sw: SW - 2, band: [3, 3], rim: false })
  return s
}

function water() {
  const d = `M128 26 C150 76 206 120 206 166 C206 210 170 236 128 236 C86 236 50 210 50 166 C50 120 106 76 128 26Z`
  return contactShadow(128, 238, 70, 10, 0.25) + toon(d, '#4FB3E8', { sw: SW, band: [10, 8], light: 1.3, spec: [[96, 160, 12, 28, -20, 0.85]] })
}

function serve() {
  return teaGlass(128, 214, 170, { saucer: true, fill: 0.84, sw: 8, shadow: false, steam: true })
}

const ICONS = {
  icon_coin: coin,
  icon_life: () => life(false),
  icon_life_broken: () => life(true),
  icon_sugar: sugar,
  icon_star: () => star(false),
  icon_star_empty: () => star(true),
  icon_fire: fire,
  icon_gift: gift,
  icon_lock: lock,
  icon_ad: ad,
  icon_trophy: trophy,
  icon_share: share,
  icon_pause: pause,
  icon_settings: gear,
  icon_shop: shop,
  icon_music: music,
  icon_sfx: sfx,
  icon_vibration: vibration,
  icon_back: back,
  icon_close: close,
  icon_clock: clock,
  icon_dem: dem,
  icon_water: water,
  icon_serve: serve,
  icon_info: info,
}

register(
  (id) => id in ICONS,
  (a) => svg(a.w, a.h, `<g transform="scale(${a.w / S})">${ICONS[a.id]()}</g>`),
)

export { shade }
