// İkonlar (256×256, saydam). Tıknaz, kalın konturlu, tek parlama. Yazı yok (bilgi ikonu çizilmiş bir şekildir).

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, rrectPath, shade, silhouette, smoothPath, starPath, svg } from '../lib/svg.mjs'
import { sugarCubeSvg } from './props.mjs'

const S = 256

/** İnce belli bardak (çaylı) — küçük ikonlar için basit profil. */
export function tulipGlass(cx, baseY, h, opts = {}) {
  const { tea = '#B5401A', broken = false, empty = false, saucer = true } = opts
  const w = h * 0.62
  const rimY = baseY - h
  const P = (t, k) => [cx + k * w * 0.5 * t[0], rimY + t[1] * h]
  // [yarıçap oranı, yükseklik oranı]
  const prof = [
    [1, 0],
    [0.92, 0.2],
    [0.66, 0.5],
    [0.74, 0.68],
    [0.8, 0.86],
    [0.66, 1],
  ]
  const right = prof.map((t) => P(t, 1))
  const left = prof.map((t) => P(t, -1)).reverse()
  const body = 'M' + right.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'L' + left.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'
  const bodySmooth = smoothPath([...right, ...left], true, 0.35)
  const teaTop = rimY + h * 0.18
  const cid = `tg${Math.round(cx)}${Math.round(baseY)}${broken ? 'b' : ''}`
  let s = ''
  if (saucer) s += cel(ellipsePath(cx, baseY + h * 0.04, w * 0.95, w * 0.2), '#F7F7F4', { sw: Math.max(3, h * 0.035), hl: [cx - w * 0.4, baseY, w * 0.3, w * 0.06] })
  s += `<clipPath id="${cid}"><path d="${bodySmooth}"/></clipPath>`
  s += `<path d="${bodySmooth}" fill="#E8F4F7" fill-opacity=".65"/>`
  if (!empty) {
    s += `<g clip-path="url(#${cid})"><rect x="${cx - w}" y="${teaTop}" width="${w * 2}" height="${h}" fill="${tea}"/>
      <ellipse cx="${cx}" cy="${teaTop}" rx="${w * 0.47}" ry="${w * 0.1}" fill="${shade(tea, 1.25)}"/>
      <rect x="${cx - w * 0.12}" y="${teaTop + h * 0.1}" width="${w * 0.24}" height="${h * 0.7}" fill="#FFB36B" opacity=".35" filter="url(#b4)"/></g>`
  }
  s += `<g clip-path="url(#${cid})"><path d="M${f(cx - w * 0.32)} ${f(rimY + h * 0.12)} Q${f(cx - w * 0.18)} ${f(rimY + h * 0.5)} ${f(cx - w * 0.3)} ${f(rimY + h * 0.86)}" stroke="#fff" stroke-width="${f(h * 0.06)}" opacity=".7" fill="none" stroke-linecap="round"/></g>`
  s += `<path d="${bodySmooth}" fill="none" stroke="${C.out}" stroke-width="${f(Math.max(4, h * 0.05))}" stroke-linejoin="round"/>`
  s += `<path d="${ellipsePath(cx, rimY, w * 0.5, w * 0.11)}" fill="#F4FBFD" fill-opacity=".6" stroke="${C.out}" stroke-width="${f(Math.max(3, h * 0.04))}"/>`
  if (broken) {
    s += line(`M${f(cx + w * 0.1)} ${f(rimY)} L${f(cx - w * 0.06)} ${f(rimY + h * 0.3)} L${f(cx + w * 0.14)} ${f(rimY + h * 0.45)} L${f(cx - w * 0.02)} ${f(rimY + h * 0.75)}`, Math.max(4, h * 0.05), C.out)
    s += line(`M${f(cx - w * 0.06)} ${f(rimY + h * 0.3)} L${f(cx - w * 0.3)} ${f(rimY + h * 0.36)}`, Math.max(3, h * 0.04), C.out)
  }
  void body
  return s
}

function coin() {
  const cx = 128
  const cy = 128
  let s = silhouette([ellipsePath(cx, cy, 104, 104)], 14)
  s += cel(ellipsePath(cx, cy, 104, 104), '#E2B33C', {
    sw: 8,
    off: [12, 12],
    hl: [cx - 44, cy - 50, 34, 18],
    hlOpacity: 0.6,
    inner: `<circle cx="${cx}" cy="${cy}" r="78" fill="none" stroke="#B68A1E" stroke-width="7"/>`,
  })
  // Kabartma: ince belli bardak silüeti
  const g = tulipGlass(cx, cy + 50, 96, { tea: '#C9971F', saucer: false })
  s += `<g opacity=".95" filter="url(#emb)">${g.replace(/#E8F4F7/g, '#D4A52A').replace(/#F4FBFD/g, '#E6BC4A').replace(/stroke="#3B2416"/g, 'stroke="#8E6A12"')}</g>`
  return svg(S, S, s, `<filter id="emb"><feDropShadow dx="-2" dy="-2" stdDeviation="0" flood-color="#FFF1B8" flood-opacity=".7"/></filter>`)
}

function life(broken = false) {
  let s = tulipGlass(128, 214, 176, { broken, tea: broken ? '#7A6A60' : '#B5401A' })
  if (broken) s = `<g opacity=".9">${s}</g>`
  return svg(S, S, s)
}

function star(empty = false) {
  const d = starPath(128, 136, 112, 50, 5)
  if (empty) {
    return svg(S, S, silhouette([d], 12) + cel(d, '#8B8F95', { sw: 8, noShadow: true, inner: `<path d="${starPath(128, 140, 70, 30, 5)}" fill="#6E7279"/>` }))
  }
  return svg(S, S, silhouette([d], 14) + cel(d, '#F6C445', { sw: 8, off: [10, 12], hl: [100, 90, 26, 16], hlOpacity: 0.7 }))
}

function fire() {
  const outer = smoothPath([[128, 16], [170, 74], [206, 130], [200, 196], [128, 238], [56, 196], [50, 130], [86, 90], [100, 120], [112, 70]], true, 0.6)
  const mid = smoothPath([[132, 90], [164, 138], [170, 190], [128, 222], [86, 190], [92, 150], [112, 160]], true, 0.6)
  const core = smoothPath([[128, 150], [148, 182], [128, 214], [108, 184]], true, 0.6)
  return svg(S, S, silhouette([outer], 14) + cel(outer, '#E8501E', { sw: 8, hl: [96, 110, 20, 30], hlOpacity: 0.35 }) + cel(mid, '#F79A2A', { sw: 0 }) + cel(core, '#FFE07A', { sw: 0, noShadow: true }))
}

function gift() {
  const box = rrectPath(40, 110, 176, 120, 14)
  const lid = rrectPath(28, 80, 200, 46, 12)
  let s = silhouette([box, lid], 14)
  s += cel(box, '#C0392B', { sw: 8, inner: `<rect x="112" y="100" width="32" height="140" fill="#F6C445"/>` })
  s += cel(lid, '#D84A3B', { sw: 8, hl: [80, 92, 30, 8], inner: `<rect x="110" y="70" width="36" height="60" fill="#F6C445"/>` })
  const bowL = smoothPath([[128, 80], [96, 30], [62, 46], [80, 80]], true)
  const bowR = smoothPath([[128, 80], [160, 30], [194, 46], [176, 80]], true)
  s += cel(bowL, '#F6C445', { sw: 7 }) + cel(bowR, '#F6C445', { sw: 7 }) + cel(ellipsePath(128, 80, 18, 16), '#E2B33C', { sw: 7 })
  return svg(S, S, s)
}

function lock() {
  const body = rrectPath(46, 112, 164, 124, 22)
  let s = line('M84 116 V82 a44 44 0 0 1 88 0 V116', 34, C.out) + line('M84 116 V82 a44 44 0 0 1 88 0 V116', 20, '#AEB8C2') + line('M78 100 V84 a42 42 0 0 1 30 -40', 6, '#fff', 'opacity=".6"')
  s += silhouette([body], 12) + cel(body, '#D9B13A', { sw: 8, hl: [90, 132, 30, 10], hlOpacity: 0.6 })
  s += `<circle cx="128" cy="164" r="16" fill="${C.out}"/><path d="M120 170 L136 170 L132 204 L124 204Z" fill="${C.out}"/>`
  return svg(S, S, s)
}

function ad() {
  const screen = rrectPath(22, 50, 212, 156, 26)
  let s = silhouette([screen], 14) + cel(screen, C.cobalt, { sw: 8, hl: [70, 74, 40, 12] })
  s += cel('M104 92 L176 128 L104 164Z', '#FFFFFF', { sw: 7, noShadow: true })
  s += `<rect x="40" y="186" width="176" height="8" rx="4" fill="${shade(C.cobalt, 0.7)}"/><rect x="40" y="186" width="70" height="8" rx="4" fill="#F6C445"/>`
  return svg(S, S, s)
}

function trophy() {
  const cup = `M64 38 H192 V92 C192 150 160 176 128 180 C96 176 64 150 64 92Z`
  const stem = `M112 176 H144 L150 206 H106Z`
  const base = rrectPath(68, 204, 120, 34, 8)
  let s = line('M66 62 C20 62 26 132 82 136', 16, C.out) + line('M66 62 C20 62 26 132 82 136', 8, '#E2B33C')
  s += line('M190 62 C236 62 230 132 174 136', 16, C.out) + line('M190 62 C236 62 230 132 174 136', 8, '#E2B33C')
  s += silhouette([cup, stem, base], 12)
  s += cel(base, '#8A5A33', { sw: 7 }) + cel(stem, '#C9A227', { sw: 7 }) + cel(cup, '#F6C445', { sw: 8, hl: [96, 70, 18, 30], hlOpacity: 0.6, inner: `<path d="${starPath(128, 100, 26, 11)}" fill="#E2A92C" stroke="#B68A1E" stroke-width="3"/>` })
  return svg(S, S, s)
}

function share() {
  const pts = [
    [70, 128],
    [186, 64],
    [186, 192],
  ]
  let s = line('M70 128 L186 64 M70 128 L186 192', 22, C.out) + line('M70 128 L186 64 M70 128 L186 192', 10, '#F5F1E8')
  for (const [x, y] of pts) s += silhouette([ellipsePath(x, y, 36, 36)], 10) + cel(ellipsePath(x, y, 36, 36), C.turq, { sw: 7, hl: [x - 12, y - 14, 10, 7] })
  return svg(S, S, s)
}

function pause() {
  const a = rrectPath(62, 46, 48, 164, 18)
  const b = rrectPath(146, 46, 48, 164, 18)
  return svg(S, S, silhouette([a, b], 12) + cel(a, '#FFF6E6', { sw: 8, hl: [78, 70, 8, 20] }) + cel(b, '#FFF6E6', { sw: 8, hl: [162, 70, 8, 20] }))
}

function settings() {
  const pts = []
  const teeth = 8
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2
    const r = i % 4 < 2 ? 108 : 84
    pts.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r])
  }
  const gear = 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'
  const hole = ellipsePath(128, 128, 36, 36)
  return svg(S, S, silhouette([gear], 12) + cel(`${gear} ${hole}`, '#AEB8C2', { sw: 8, fillRule: 'evenodd', hl: [90, 80, 26, 14] }) + `<circle cx="128" cy="128" r="58" fill="none" stroke="#8B96A1" stroke-width="6"/>`)
}

function shop() {
  // Çarşı tentesi: çizgili tente + küçük tezgâh
  const stall = rrectPath(44, 130, 168, 98, 10)
  const aw = `M24 70 L232 70 L222 130 Q206 150 190 130 Q174 150 158 130 Q142 150 126 130 Q110 150 94 130 Q78 150 62 130 Q46 150 34 130Z`
  const stripes = [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${24 + i * 34.6} 60 L${44 + i * 34.6} 60 L${38 + i * 34.6} 150 L${18 + i * 34.6} 150Z" fill="#FFF6E6"/>`).join('')
  let s = silhouette([stall, aw], 12)
  s += cel(stall, '#8A5A33', { sw: 8, inner: `<rect x="62" y="150" width="132" height="58" rx="6" fill="#5E3A1E"/><circle cx="96" cy="176" r="16" fill="#E8501E" stroke="${C.out}" stroke-width="4"/><circle cx="128" cy="180" r="16" fill="#F6C445" stroke="${C.out}" stroke-width="4"/><circle cx="160" cy="176" r="16" fill="#4E9A3A" stroke="${C.out}" stroke-width="4"/>` })
  s += line('M44 70 V40 H212 V70', 12, C.out) + line('M44 70 V40 H212 V70', 4, '#C9A227')
  s += cel(aw, '#C0392B', { sw: 8, inner: stripes })
  return svg(S, S, s)
}

function music() {
  let s = line('M96 186 V58 L196 38 V160', 22, C.out) + line('M96 186 V58 L196 38 V160', 10, '#FFF6E6')
  s += cel('M92 56 L200 34 L200 70 L92 92Z', '#FFF6E6', { sw: 7, noShadow: true })
  s += cel(ellipsePath(76, 190, 34, 26), '#FFF6E6', { sw: 8, hl: [64, 180, 10, 6] }) + cel(ellipsePath(176, 164, 34, 26), '#FFF6E6', { sw: 8, hl: [164, 154, 10, 6] })
  return svg(S, S, s)
}

function sfx() {
  const sp = 'M40 98 H84 L140 50 V206 L84 158 H40Z'
  let s = silhouette([sp], 12) + cel(sp, '#FFF6E6', { sw: 8, hl: [70, 110, 14, 10] })
  s += line('M168 98 Q186 128 168 158', 14, C.out) + line('M168 98 Q186 128 168 158', 6, '#FFF6E6')
  s += line('M194 74 Q228 128 194 182', 14, C.out) + line('M194 74 Q228 128 194 182', 6, '#FFF6E6')
  return svg(S, S, s)
}

function vibration() {
  const phone = rrectPath(84, 34, 88, 188, 18)
  let s = silhouette([phone], 12) + cel(phone, '#30363D', { sw: 8, inner: `<rect x="96" y="54" width="64" height="136" rx="6" fill="${C.turq}"/><circle cx="128" cy="204" r="7" fill="#596270"/>` })
  for (const [x, d] of [
    [56, -1],
    [200, 1],
  ]) {
    s += line(`M${x} 84 l${-12 * d} 16 l${12 * d} 16 l${-12 * d} 16 l${12 * d} 16 l${-12 * d} 16`, 14, C.out) + line(`M${x} 84 l${-12 * d} 16 l${12 * d} 16 l${-12 * d} 16 l${12 * d} 16 l${-12 * d} 16`, 6, '#FFF6E6')
  }
  return svg(S, S, s)
}

function back() {
  const d = 'M30 128 L118 48 L118 92 L220 92 L220 164 L118 164 L118 208Z'
  return svg(S, S, silhouette([d], 12) + cel(d, '#FFF6E6', { sw: 8, hl: [96, 100, 30, 10] }))
}

function close() {
  const d = 'M64 40 L128 104 L192 40 L216 64 L152 128 L216 192 L192 216 L128 152 L64 216 L40 192 L104 128 L40 64Z'
  return svg(S, S, silhouette([d], 12) + cel(d, '#E35D4F', { sw: 8, hl: [70, 64, 14, 10] }))
}

function clock() {
  let s = silhouette([ellipsePath(128, 128, 106, 106)], 12)
  s += cel(ellipsePath(128, 128, 106, 106), '#C9A227', { sw: 8, hl: [84, 72, 30, 14] })
  s += cel(ellipsePath(128, 128, 82, 82), '#FFF6E6', { sw: 6, noShadow: true })
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    s += `<circle cx="${f(128 + Math.cos(a) * 66)}" cy="${f(128 + Math.sin(a) * 66)}" r="${i % 3 === 0 ? 7 : 4}" fill="${C.out}"/>`
  }
  s += line('M128 128 L128 76', 12) + line('M128 128 L168 150', 10) + `<circle cx="128" cy="128" r="10" fill="${C.tea}" stroke="${C.out}" stroke-width="4"/>`
  return svg(S, S, s)
}

function dem() {
  // Demlik silüeti
  const body = smoothPath([[78, 96], [52, 120], [44, 160], [60, 200], [128, 214], [196, 200], [212, 160], [204, 120], [178, 96]], false)
  const bodyD = body + 'Z'
  const lid = `M84 98 C90 62 166 62 172 98Z`
  const spout = 'M196 150 C222 146 230 116 244 90 L250 98 C238 130 232 168 200 182Z'
  const handle = 'M56 120 C14 118 14 196 60 190 L64 176 C34 178 34 134 62 138Z'
  let s = silhouette([bodyD, lid, spout, handle], 12)
  s += cel(handle, C.out, { sw: 6, noShadow: true }) + cel(spout, C.tea, { sw: 7 }) + cel(bodyD, C.tea, { sw: 8, hl: [96, 128, 24, 18], hlOpacity: 0.45 }) + cel(lid, shade(C.tea, 1.15), { sw: 7 })
  s += cel(ellipsePath(128, 56, 16, 14), C.out, { sw: 5, noShadow: true })
  return svg(S, S, s)
}

function water() {
  const d = 'M128 18 C150 58 204 112 204 160 A76 76 0 0 1 52 160 C52 112 106 58 128 18Z'
  return svg(S, S, silhouette([d], 12) + cel(d, '#5BB8E6', { sw: 8, off: [12, 10], hl: [100, 130, 18, 30], hlOpacity: 0.7 }))
}

function serve() {
  const tray = ellipsePath(128, 196, 112, 30)
  let s = silhouette([tray], 12) + cel(tray, '#D9B13A', { sw: 8, hl: [90, 186, 40, 8], inner: `<path d="${ellipsePath(128, 198, 90, 22)}" fill="#C99F2C"/>` })
  s += tulipGlass(128, 196, 140, { saucer: true })
  return svg(S, S, s)
}

function info() {
  let s = silhouette([ellipsePath(128, 128, 106, 106)], 12) + cel(ellipsePath(128, 128, 106, 106), C.cobalt, { sw: 8, hl: [88, 76, 30, 14] })
  s += `<circle cx="128" cy="76" r="16" fill="#FFF6E6" stroke="${C.out}" stroke-width="5"/>`
  s += cel(rrectPath(112, 104, 32, 92, 12), '#FFF6E6', { sw: 6, noShadow: true })
  return svg(S, S, s)
}

const ICONS = {
  icon_coin: coin,
  icon_life: () => life(false),
  icon_life_broken: () => life(true),
  icon_sugar: () => svg(S, S, `<g transform="translate(16 14) scale(1.75)">${sugarCubeSvg(128)}</g>`),
  icon_star: () => star(false),
  icon_star_empty: () => star(true),
  icon_fire: fire,
  icon_gift: gift,
  icon_lock: lock,
  icon_ad: ad,
  icon_trophy: trophy,
  icon_share: share,
  icon_pause: pause,
  icon_settings: settings,
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
  (a) => ICONS[a.id](),
)
