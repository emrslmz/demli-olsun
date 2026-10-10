// v2 arka planlar (opak JPG): yalnızca arka duvar/manzara. Tezgâh ayrı katmandır (prop_tezgah).
// Kompozisyon: tezgâhın arka kenarı yüksekliğin %50'sinde (meta.counterY). Müşteri ortada, bu çizginin
// hemen üstünde durur; o bölge sakin tutulur. Pencere solda, raf sağ üstte, lamba üstte. Işık sıcak, sol üstten.

import { register } from './index.mjs'
import { C, ellipsePath, f, mix, rng, rrectPath, shade, smoothPath, starPath, svg } from '../lib/svg.mjs'
import { lg, rg, toon } from '../lib/toon.mjs'
import { teaGlass } from '../lib/teaGlass.mjs'

export const BG_COUNTER = 0.5
const OUT = C.out

// ---------- Ortak parçalar ----------

function plaster(W, y0, y1, color, seed) {
  const r = rng(seed)
  const [g, gd] = lg([
    [0, shade(color, 0.86)],
    [0.5, color],
    [1, shade(color, 0.93)],
  ])
  let s = gd + `<rect x="0" y="${f(y0)}" width="${W}" height="${f(y1 - y0)}" fill="url(#${g})"/>`
  for (let i = 0; i < 26; i++) {
    const x = r() * W
    const y = y0 + r() * (y1 - y0)
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(40 + r() * 120)}" ry="${f(20 + r() * 60)}" fill="${r() > 0.5 ? '#fff' : shade(color, 0.85)}" opacity="${f(0.06 + r() * 0.07)}" filter="url(#b14)"/>`
  }
  return s
}

function ceiling(W, h, wood = '#4A2E1A') {
  let s = `<rect x="0" y="0" width="${W}" height="${f(h)}" fill="${shade(wood, 0.8)}"/>`
  const n = Math.max(4, Math.round(W / 260))
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) * W) / n
    s += toon(rrectPath(x - 40, -20, 80, h + 10, 10), wood, { sw: 6, band: [8, 0], dir: 'v' })
  }
  s += toon(`M0 ${f(h - 40)} H${W} V${f(h + 6)} H0Z`, shade(wood, 1.1), { sw: 6, band: [0, 8], dir: 'v' })
  return s
}

function lamp(cx, y0, len, s0 = 1, on = true) {
  const y = y0 + len
  let s = `<path d="M${f(cx)} ${f(y0)} V${f(y - 50 * s0)}" stroke="${OUT}" stroke-width="${f(6 * s0)}"/>`
  if (on) {
    const [gg, ggd] = rg(
      [
        [0, '#FFE7A8', 0.85],
        [0.35, '#FFC86B', 0.35],
        [1, '#FFB347', 0],
      ],
      0.5,
      0.5,
      0.5,
    )
    s += ggd + `<circle cx="${f(cx)}" cy="${f(y + 40 * s0)}" r="${f(320 * s0)}" fill="url(#${gg})"/>`
  }
  const shadeD = `M${f(cx - 90 * s0)} ${f(y + 30 * s0)} Q${f(cx - 70 * s0)} ${f(y - 52 * s0)} ${f(cx)} ${f(y - 56 * s0)} Q${f(cx + 70 * s0)} ${f(y - 52 * s0)} ${f(cx + 90 * s0)} ${f(y + 30 * s0)}Z`
  s += toon(shadeD, '#1E7A5C', { sw: 6 * s0, band: [10 * s0, 4 * s0], spec: [[cx - 40 * s0, y - 20 * s0, 22 * s0, 8 * s0, -30, 0.6]] })
  s += `<path d="M${f(cx - 90 * s0)} ${f(y + 30 * s0)} Q${f(cx)} ${f(y + 50 * s0)} ${f(cx + 90 * s0)} ${f(y + 30 * s0)}" fill="#FFE9B0" stroke="${OUT}" stroke-width="${f(5 * s0)}"/>`
  s += `<ellipse cx="${f(cx)}" cy="${f(y + 42 * s0)}" rx="${f(26 * s0)}" ry="${f(14 * s0)}" fill="#FFF6D8"/>`
  return s
}

function wallClock(cx, cy, r) {
  let s = `<ellipse cx="${f(cx + 8)}" cy="${f(cy + 12)}" rx="${f(r)}" ry="${f(r)}" fill="#2A1408" opacity=".25" filter="url(#b8)"/>`
  s += toon(ellipsePath(cx, cy, r, r), '#8A5A33', { sw: 7, band: [8, 8], spec: [[cx - r * 0.55, cy - r * 0.55, r * 0.18, r * 0.08, -45, 0.6]] })
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.8)}" fill="#FFF8E7" stroke="${OUT}" stroke-width="5"/>`
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    s += `<circle cx="${f(cx + Math.cos(a) * r * 0.66)}" cy="${f(cy + Math.sin(a) * r * 0.66)}" r="${f(r * (i % 3 === 0 ? 0.06 : 0.03))}" fill="${OUT}"/>`
  }
  s += `<path d="M${f(cx)} ${f(cy)} L${f(cx + r * 0.32)} ${f(cy - r * 0.38)} M${f(cx)} ${f(cy)} L${f(cx - r * 0.1)} ${f(cy - r * 0.58)}" stroke="${OUT}" stroke-width="${f(r * 0.07)}" stroke-linecap="round"/>`
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.07)}" fill="#C0392B" stroke="${OUT}" stroke-width="3"/>`
  s += `<ellipse cx="${f(cx - r * 0.35)}" cy="${f(cy - r * 0.4)}" rx="${f(r * 0.3)}" ry="${f(r * 0.12)}" transform="rotate(-35 ${f(cx - r * 0.35)} ${f(cy - r * 0.4)})" fill="#fff" opacity=".55"/>`
  return s
}

/** İstanbul sokağı / mahalle evleri (pencere içi). mode: day | snow | night | sunny */
function streetView(x, y, w, h, mode = 'day') {
  const sky =
    mode === 'night'
      ? [
          [0, '#1D1640'],
          [1, '#4A2A6A'],
        ]
      : mode === 'snow'
        ? [
            [0, '#9DB8CF'],
            [1, '#E3EDF4'],
          ]
        : mode === 'sunny'
          ? [
              [0, '#5CC3F0'],
              [1, '#CFF0FF'],
            ]
          : [
              [0, '#7EC4EA'],
              [1, '#DDF2FB'],
            ]
  const [sg, sgd] = lg(sky)
  let s = sgd + `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#${sg})"/>`
  if (mode === 'night') {
    s += `<circle cx="${f(x + w * 0.75)}" cy="${f(y + h * 0.18)}" r="${f(w * 0.09)}" fill="#FFF3C4"/>`
    s += `<circle cx="${f(x + w * 0.78)}" cy="${f(y + h * 0.16)}" r="${f(w * 0.08)}" fill="#1D1640"/>`
  } else {
    s += `<circle cx="${f(x + w * 0.78)}" cy="${f(y + h * 0.16)}" r="${f(w * 0.12)}" fill="#FFF6C8" opacity=".85" filter="url(#b8)"/>`
    s += `<ellipse cx="${f(x + w * 0.25)}" cy="${f(y + h * 0.15)}" rx="${f(w * 0.2)}" ry="${f(h * 0.04)}" fill="#fff" opacity=".8"/>`
  }
  // Uzakta minare ve kubbe silueti
  const far = mode === 'night' ? '#2E2350' : '#A9C4D6'
  s += `<path d="M${f(x)} ${f(y + h * 0.55)} Q${f(x + w * 0.3)} ${f(y + h * 0.48)} ${f(x + w * 0.5)} ${f(y + h * 0.52)} Q${f(x + w * 0.7)} ${f(y + h * 0.46)} ${f(x + w)} ${f(y + h * 0.5)} V${f(y + h)} H${f(x)}Z" fill="${far}"/>`
  s += `<path d="M${f(x + w * 0.62)} ${f(y + h * 0.5)} a${f(w * 0.12)} ${f(w * 0.1)} 0 0 1 ${f(w * 0.24)} 0Z" fill="${far}"/>`
  s += `<rect x="${f(x + w * 0.58)}" y="${f(y + h * 0.26)}" width="${f(w * 0.025)}" height="${f(h * 0.26)}" fill="${far}"/><path d="M${f(x + w * 0.58)} ${f(y + h * 0.26)} l${f(w * 0.0125)} ${f(-h * 0.06)} l${f(w * 0.0125)} ${f(h * 0.06)}Z" fill="${far}"/>`
  // Renkli ahşap evler
  const houses = ['#E9A23B', '#C0533A', '#5E9C76', '#E8D3A0', '#7A9CC6']
  const hw = w / 3.2
  for (let i = 0; i < 4; i++) {
    const hx = x - hw * 0.3 + i * hw * 0.95
    const top = y + h * (0.52 + (i % 2) * 0.06)
    const c = houses[i % houses.length]
    const body = `M${f(hx)} ${f(y + h + 4)} V${f(top)} L${f(hx + hw / 2)} ${f(top - hw * 0.32)} L${f(hx + hw)} ${f(top)} V${f(y + h + 4)}Z`
    s += toon(body, mode === 'night' ? shade(c, 0.55) : c, { sw: 5, band: [6, 0], rim: false })
    const roof = `M${f(hx - 10)} ${f(top + 4)} L${f(hx + hw / 2)} ${f(top - hw * 0.36)} L${f(hx + hw + 10)} ${f(top + 4)}`
    s += `<path d="${roof}" fill="none" stroke="${OUT}" stroke-width="16" stroke-linecap="round"/><path d="${roof}" fill="none" stroke="${mode === 'snow' ? '#FFFFFF' : '#A8452E'}" stroke-width="9" stroke-linecap="round"/>`
    for (let k = 0; k < 2; k++) {
      const wx = hx + hw * (0.22 + k * 0.34)
      const lit = mode === 'night'
      s += `<rect x="${f(wx)}" y="${f(top + hw * 0.12)}" width="${f(hw * 0.2)}" height="${f(hw * 0.26)}" rx="3" fill="${lit ? '#FFD36B' : '#3A5A7A'}" stroke="${OUT}" stroke-width="4"/>`
    }
  }
  if (mode === 'snow') {
    const r = rng('snowwin' + x)
    for (let i = 0; i < 40; i++) s += `<circle cx="${f(x + r() * w)}" cy="${f(y + r() * h)}" r="${f(2 + r() * 4)}" fill="#fff" opacity=".9"/>`
  }
  if (mode === 'night') {
    for (let i = 0; i < 3; i++) {
      const bx = x + w * (0.2 + i * 0.22)
      const by = y + h * (0.2 + (i % 2) * 0.1)
      s += `<path d="M${f(bx)} ${f(by)} q8 -10 16 -2 q6 -10 12 0 q8 -8 16 2 q-12 0 -22 10 q-10 -10 -22 -10Z" fill="#120B22"/>`
    }
  }
  return s
}

function windowFrame(x, y, w, h, mode, wood = '#7A4A2A') {
  let s = `<rect x="${f(x - 30)}" y="${f(y - 30)}" width="${f(w + 60)}" height="${f(h + 70)}" rx="18" fill="#2A1408" opacity=".25" filter="url(#b8)"/>`
  const cid = 'win' + Math.round(x)
  s += `<clipPath id="${cid}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="10"/></clipPath>`
  s += `<g clip-path="url(#${cid})">${streetView(x, y, w, h, mode)}</g>`
  // Cam yansıması
  s += `<path d="M${f(x + w * 0.1)} ${f(y + h)} L${f(x + w * 0.45)} ${f(y)} L${f(x + w * 0.6)} ${f(y)} L${f(x + w * 0.25)} ${f(y + h)}Z" fill="#fff" opacity=".18"/>`
  const frame = `M${f(x - 24)} ${f(y - 24)} H${f(x + w + 24)} V${f(y + h + 24)} H${f(x - 24)}Z M${f(x)} ${f(y)} V${f(y + h)} H${f(x + w)} V${f(y)}Z`
  s += toon(frame, wood, { sw: 7, band: [8, 8], fillRule: 'evenodd' })
  s += toon(rrectPath(x + w / 2 - 9, y, 18, h, 4), wood, { sw: 6, band: [3, 0], rim: false })
  s += toon(rrectPath(x, y + h * 0.48 - 9, w, 18, 4), wood, { sw: 6, band: [0, 3], rim: false })
  // Pencere pervazı ve saksı
  s += toon(rrectPath(x - 44, y + h + 10, w + 88, 36, 10), shade(wood, 1.15), { sw: 7, band: [0, 8] })
  return s
}

function potPlant(cx, baseY, sc = 1, flower = '#E8392F') {
  let s = ''
  const leaves = [
    [-50, -70, -20],
    [40, -80, 25],
    [-10, -110, 0],
    [60, -40, 50],
    [-62, -36, -50],
  ]
  for (const [dx, dy, rot] of leaves)
    s += `<g transform="rotate(${rot} ${f(cx + dx * sc)} ${f(baseY + dy * sc)})">${toon(ellipsePath(cx + dx * sc, baseY + dy * sc, 26 * sc, 46 * sc), '#4E9A3A', { sw: 5, band: [4, 4], rim: false })}</g>`
  for (const [dx, dy] of [
    [-30, -96],
    [26, -110],
    [56, -70],
  ])
    s += toon(ellipsePath(cx + dx * sc, baseY + dy * sc, 18 * sc, 18 * sc), flower, { sw: 5, band: [3, 3], rim: false, spec: [[cx + dx * sc - 5 * sc, baseY + dy * sc - 6 * sc, 5 * sc, 3 * sc, 0, 0.7]] })
  const pot = `M${f(cx - 60 * sc)} ${f(baseY - 40 * sc)} H${f(cx + 60 * sc)} L${f(cx + 46 * sc)} ${f(baseY + 30 * sc)} H${f(cx - 46 * sc)}Z`
  s += toon(pot, '#C0703A', { sw: 6, band: [8, 0], spec: [[cx - 36 * sc, baseY - 20 * sc, 8 * sc, 18 * sc, 0, 0.5]] })
  s += toon(rrectPath(cx - 66 * sc, baseY - 52 * sc, 132 * sc, 20 * sc, 6 * sc), '#D88246', { sw: 6, band: [0, 4], rim: false })
  return s
}

function shelf(x0, x1, y, wood = '#8A5A33') {
  let s = `<rect x="${f(x0)}" y="${f(y + 18)}" width="${f(x1 - x0)}" height="30" fill="#2A1408" opacity=".22" filter="url(#b8)"/>`
  for (const bx of [x0 + 40, x1 - 60]) s += toon(`M${f(bx)} ${f(y + 20)} h20 v50 q-10 0 -20 -20Z`, shade(wood, 0.85), { sw: 5, band: [3, 0], rim: false })
  s += toon(rrectPath(x0, y, x1 - x0, 26, 6), wood, { sw: 7, band: [0, 8], dir: 'v' })
  return s
}

function teaTin(x, baseY, w, h, color, band = '#E2B33C') {
  const d = rrectPath(x - w / 2, baseY - h, w, h, 10)
  return (
    toon(d, color, {
      sw: 6,
      band: [8, 0],
      inner: `<rect x="${f(x - w / 2)}" y="${f(baseY - h * 0.62)}" width="${f(w)}" height="${f(h * 0.3)}" fill="${band}"/><circle cx="${f(x)}" cy="${f(baseY - h * 0.47)}" r="${f(w * 0.16)}" fill="${color}"/>`,
      spec: [[x - w * 0.28, baseY - h * 0.7, w * 0.07, h * 0.22, 0, 0.55]],
    }) + toon(rrectPath(x - w / 2 - 4, baseY - h - 14, w + 8, 20, 6), shade(color, 0.85), { sw: 6, band: [0, 4], rim: false })
  )
}

function semaver(cx, baseY, h) {
  const w = h * 0.5
  let s = ''
  const body = smoothPath([
    [cx - w * 0.3, baseY - h * 0.14],
    [cx - w * 0.52, baseY - h * 0.4],
    [cx - w * 0.48, baseY - h * 0.66],
    [cx - w * 0.26, baseY - h * 0.76],
    [cx + w * 0.26, baseY - h * 0.76],
    [cx + w * 0.48, baseY - h * 0.66],
    [cx + w * 0.52, baseY - h * 0.4],
    [cx + w * 0.3, baseY - h * 0.14],
  ])
  const base = `M${f(cx - w * 0.36)} ${f(baseY)} L${f(cx - w * 0.2)} ${f(baseY - h * 0.16)} H${f(cx + w * 0.2)} L${f(cx + w * 0.36)} ${f(baseY)}Z`
  s += toon(base, '#C9A227', { sw: 6, band: [6, 0] })
  s += toon(body, '#D9A93A', { sw: 7, band: [12, 4], spec: [[cx - w * 0.28, baseY - h * 0.5, w * 0.06, h * 0.16, 0, 0.75]] })
  s += toon(rrectPath(cx - w * 0.2, baseY - h * 0.9, w * 0.4, h * 0.14, 8), '#C9A227', { sw: 6, band: [4, 0] })
  s += toon(ellipsePath(cx, baseY - h * 0.94, w * 0.14, w * 0.08), '#C9A227', { sw: 5, band: [2, 2], rim: false })
  // Musluk ve kulplar
  s += toon(`M${f(cx + w * 0.1)} ${f(baseY - h * 0.3)} h${f(w * 0.3)} v${f(h * 0.06)} h${f(-w * 0.12)} v${f(h * 0.05)} h${f(-w * 0.08)} v${f(-h * 0.05)} h${f(-w * 0.1)}Z`, '#B88A1E', { sw: 5, band: [2, 2], rim: false })
  for (const side of [-1, 1]) s += `<path d="M${f(cx + side * w * 0.5)} ${f(baseY - h * 0.62)} q${f(side * w * 0.16)} ${f(h * 0.04)} ${f(side * w * 0.04)} ${f(h * 0.14)}" fill="none" stroke="${OUT}" stroke-width="12" stroke-linecap="round"/><path d="M${f(cx + side * w * 0.5)} ${f(baseY - h * 0.62)} q${f(side * w * 0.16)} ${f(h * 0.04)} ${f(side * w * 0.04)} ${f(h * 0.14)}" fill="none" stroke="#E2B33C" stroke-width="5" stroke-linecap="round"/>`
  return s
}

/** İznik çini kuşak (tezgâhın arkasında, alt duvar). */
function tileBand(W, y0, y1, s0 = 1) {
  let s = `<rect x="0" y="${f(y0)}" width="${W}" height="${f(y1 - y0)}" fill="#F4F1EA"/>`
  const t = 150 * s0
  for (let x = 0; x < W + t; x += t) {
    for (let y = y0 + 24 * s0; y < y1; y += t) {
      const cx = x + t / 2
      const cy = y + t / 2
      s += `<path d="${ellipsePath(cx, cy, t * 0.42, t * 0.42)}" fill="none" stroke="#2F7FBF" stroke-width="${f(5 * s0)}" opacity=".85"/>`
      s += `<path d="${starPath(cx, cy, t * 0.28, t * 0.12, 6)}" fill="#1F4E8C" opacity=".85"/>`
      s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(t * 0.07)}" fill="#C0392B"/>`
      s += `<path d="M${f(x)} ${f(y)} q${f(t * 0.12)} ${f(t * 0.12)} 0 ${f(t * 0.25)}" fill="none" stroke="#1E9AA8" stroke-width="${f(6 * s0)}"/>`
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(t)}" height="${f(t)}" fill="none" stroke="#CFC6B6" stroke-width="${f(3 * s0)}"/>`
    }
  }
  s += toon(rrectPath(-10, y0 - 6, W + 20, 30 * s0, 6), '#8A5A33', { sw: 6, band: [0, 6], dir: 'v' })
  s += `<rect x="0" y="${f(y0)}" width="${W}" height="${f(y1 - y0)}" fill="#7A5A3A" opacity=".08"/>`
  return s
}

function lightBeam(x0, y0, x1, y1, w0, w1) {
  const [g, gd] = lg(
    [
      [0, '#FFF3C8', 0.35],
      [1, '#FFF3C8', 0],
    ],
    0,
    0,
    1,
    1,
  )
  return gd + `<path d="M${f(x0)} ${f(y0)} L${f(x0 + w0)} ${f(y0)} L${f(x1 + w1)} ${f(y1)} L${f(x1)} ${f(y1)}Z" fill="url(#${g})" filter="url(#b8)"/>`
}

function vignette(W, H) {
  const [g, gd] = rg(
    [
      [0.55, '#000', 0],
      [1, '#1A0C04', 0.45],
    ],
    0.5,
    0.32,
    0.85,
  )
  return gd + `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${g})"/>`
}

function pumpkin(cx, baseY, r) {
  let s = ''
  for (const dx of [-0.45, 0.45, 0]) s += toon(ellipsePath(cx + dx * r, baseY - r * 0.8, r * 0.62, r * 0.8), '#F07C1E', { sw: 6, band: [6, 4], rim: false })
  s += `<path d="M${f(cx - r * 0.4)} ${f(baseY - r * 0.95)} l${f(r * 0.16)} ${f(-r * 0.18)} l${f(r * 0.16)} ${f(r * 0.18)}Z M${f(cx + r * 0.08)} ${f(baseY - r * 0.95)} l${f(r * 0.16)} ${f(-r * 0.18)} l${f(r * 0.16)} ${f(r * 0.18)}Z M${f(cx - r * 0.4)} ${f(baseY - r * 0.55)} q${f(r * 0.4)} ${f(r * 0.3)} ${f(r * 0.8)} 0 l${f(-r * 0.1)} ${f(r * 0.14)} q${f(-r * 0.3)} ${f(r * 0.14)} ${f(-r * 0.6)} 0Z" fill="#FFD36B" stroke="${OUT}" stroke-width="4"/>`
  s += toon(rrectPath(cx - r * 0.08, baseY - r * 1.78, r * 0.16, r * 0.26, 4), '#4E7A2F', { sw: 5, band: [2, 0], rim: false })
  return s
}

function garland(W, y, sag, color = '#2F5D50') {
  const d = `M0 ${f(y)} Q${f(W / 4)} ${f(y + sag)} ${f(W / 2)} ${f(y)} Q${f((W * 3) / 4)} ${f(y + sag)} ${W} ${f(y)}`
  let s = `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="30" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="22" stroke-linecap="round"/>`
  const bulbs = ['#E8392F', '#F6C445', '#1E9AA8', '#7BC043']
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12
    const half = t < 0.5 ? t * 2 : (t - 0.5) * 2
    const bx = t * W
    const by = y + sag * 2 * half * (1 - half) * 2 * 0.5 + 16
    s += `<circle cx="${f(bx)}" cy="${f(by)}" r="22" fill="${bulbs[i % 4]}" opacity=".45" filter="url(#b8)"/><circle cx="${f(bx)}" cy="${f(by)}" r="11" fill="${bulbs[i % 4]}" stroke="${OUT}" stroke-width="4"/>`
  }
  return s
}

function cobweb(x, y, size, dir = 1) {
  let s = ''
  for (let i = 0; i < 5; i++) {
    const a = (i / 4) * (Math.PI / 2)
    s += `<path d="M${x} ${y} L${f(x + dir * Math.cos(a) * size)} ${f(y + Math.sin(a) * size)}" stroke="#fff" stroke-width="3" opacity=".7"/>`
  }
  for (let k = 1; k <= 3; k++) {
    const r = (size * k) / 3.3
    let d = ''
    for (let i = 0; i <= 4; i++) {
      const a = (i / 4) * (Math.PI / 2)
      d += `${i === 0 ? 'M' : 'Q'}${i === 0 ? '' : `${f(x + dir * Math.cos(a - 0.2) * r * 0.85)} ${f(y + Math.sin(a - 0.2) * r * 0.85)} `}${f(x + dir * Math.cos(a) * r)} ${f(y + Math.sin(a) * r)} `
    }
    s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>`
  }
  return s
}

// ---------- Mekanlar ----------

function mahalle(W, H, theme) {
  const CY = H * BG_COUNTER
  const sc = W / 1080
  const wallC = theme === 'halloween' ? '#8A6A7A' : theme === 'kis' ? '#E2CFA8' : theme === 'yaz' ? '#F1D49A' : '#E9C58F'
  let s = plaster(W, 0, CY, wallC, 'mahalle' + W)
  s += tileBand(W, CY - 190 * sc, H, sc)
  // Pencere (solda)
  const mode = theme === 'kis' ? 'snow' : theme === 'halloween' ? 'night' : theme === 'yaz' ? 'sunny' : 'day'
  const wx = 70 * sc
  const wy = CY - 900 * sc
  const ww = Math.min(380 * sc, W * 0.34)
  const wh = 520 * sc
  if (theme !== 'halloween') s += lightBeam(wx, wy, wx + 260 * sc, CY, ww, ww * 1.2)
  s += windowFrame(wx, wy, ww, wh, mode)
  s += potPlant(wx + ww * 0.75, wy + wh + 24 * sc, 0.9 * sc, theme === 'halloween' ? '#7A3A9A' : '#E8392F')
  // Raf (sağ üst): bardaklar, çay kutuları, semaver
  const sx0 = W - 520 * sc
  const sx1 = W - 30 * sc
  const sy = CY - 600 * sc
  s += shelf(sx0, sx1, sy)
  s += semaver(sx0 + 90 * sc, sy, 230 * sc)
  for (let i = 0; i < 4; i++) {
    const gx = sx0 + 200 * sc + i * 70 * sc
    s += teaGlass(gx, sy - 2, 110 * sc, { fill: i % 2 ? 0 : 0.8, shadow: false, sw: 4 * sc })
  }
  s += teaTin(sx1 - 50 * sc, sy, 70 * sc, 110 * sc, '#1F4E8C')
  if (theme === 'halloween') s += pumpkin(sx1 - 140 * sc, sy, 60 * sc)
  // Saat (sağ üst, rafın üstünde)
  s += wallClock(W - 220 * sc, sy - 300 * sc, 92 * sc)
  // Tavan ve lambalar
  s += ceiling(W, 140 * sc)
  s += lamp(W * 0.5, 120 * sc, 180 * sc, sc)
  if (W > 1300) s += lamp(W * 0.16, 120 * sc, 140 * sc, sc * 0.8)
  if (theme === 'kis') s += garland(W, 170 * sc, 70 * sc)
  if (theme === 'halloween') {
    s += cobweb(0, 140 * sc, 200 * sc, 1) + cobweb(W, 140 * sc, 200 * sc, -1)
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#2A1840" opacity=".25"/>`
  }
  if (theme === 'yaz') s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFE3A0" opacity=".08"/>`
  s += vignette(W, H)
  return s
}

function sahil(W, H) {
  const CY = H * BG_COUNTER
  const sc = W / 1080
  const horizon = CY - 420 * sc
  const [sg, sgd] = lg([
    [0, '#5BB8E8'],
    [0.75, '#BDE7F7'],
    [1, '#FFE6B8'],
  ])
  let s = sgd + `<rect x="0" y="0" width="${W}" height="${f(horizon)}" fill="url(#${sg})"/>`
  s += `<circle cx="${f(W * 0.8)}" cy="${f(horizon - 380 * sc)}" r="${f(90 * sc)}" fill="#FFF3C4" opacity=".9" filter="url(#b14)"/>`
  for (const [x, y, w] of [
    [0.2, 0.22, 200],
    [0.62, 0.3, 160],
  ])
    s += `<ellipse cx="${f(W * x)}" cy="${f(horizon * y + 200 * sc)}" rx="${f(w * sc)}" ry="${f(34 * sc)}" fill="#fff" opacity=".85"/>`
  // Karşı kıyı
  s += `<path d="M0 ${f(horizon - 40 * sc)} Q${f(W * 0.3)} ${f(horizon - 110 * sc)} ${f(W * 0.6)} ${f(horizon - 60 * sc)} T${W} ${f(horizon - 70 * sc)} V${f(horizon)} H0Z" fill="#8FB5A6"/>`
  for (let i = 0; i < 14; i++) s += `<rect x="${f(i * (W / 14) + 10)}" y="${f(horizon - 50 * sc - (i % 3) * 12 * sc)}" width="${f(26 * sc)}" height="${f(30 * sc)}" fill="${['#E8D3A0', '#C0533A', '#F4F1EA'][i % 3]}" opacity=".8"/>`
  // Deniz
  const [wg, wgd] = lg([
    [0, '#2E8FC0'],
    [1, '#1A6A9A'],
  ])
  s += wgd + `<rect x="0" y="${f(horizon)}" width="${W}" height="${f(H - horizon)}" fill="url(#${wg})"/>`
  const r = rng('sea' + W)
  for (let i = 0; i < 40; i++) {
    const y = horizon + 20 * sc + r() * (CY - horizon)
    s += `<path d="M${f(r() * W)} ${f(y)} q${f(14 * sc)} ${f(-6 * sc)} ${f(28 * sc)} 0" stroke="#fff" stroke-width="${f(3 * sc)}" fill="none" opacity="${f(0.3 + r() * 0.4)}"/>`
  }
  // Kız Kulesi
  const kx = W * 0.3
  const ky = horizon + 30 * sc
  s += toon(rrectPath(kx - 70 * sc, ky - 40 * sc, 140 * sc, 50 * sc, 8), '#E8E2D2', { sw: 5, band: [6, 0], rim: false })
  s += toon(rrectPath(kx - 22 * sc, ky - 150 * sc, 44 * sc, 120 * sc, 6), '#F4F1EA', { sw: 5, band: [5, 0], rim: false })
  s += toon(`M${f(kx - 28 * sc)} ${f(ky - 150 * sc)} L${f(kx)} ${f(ky - 210 * sc)} L${f(kx + 28 * sc)} ${f(ky - 150 * sc)}Z`, '#5E7A8A', { sw: 5, band: [3, 0], rim: false })
  // Martılar
  for (const [x, y] of [
    [0.55, 0.3],
    [0.68, 0.24],
    [0.15, 0.36],
  ])
    s += `<path d="M${f(W * x)} ${f(horizon * y + 140 * sc)} q${f(18 * sc)} ${f(-18 * sc)} ${f(36 * sc)} 0 q${f(18 * sc)} ${f(-18 * sc)} ${f(36 * sc)} 0" fill="none" stroke="${OUT}" stroke-width="${f(6 * sc)}" stroke-linecap="round"/>`
  // Korkuluk
  const ry = CY - 160 * sc
  s += toon(rrectPath(-10, ry, W + 20, 24 * sc, 8), '#F4F1EA', { sw: 6, band: [0, 6] })
  for (let x = 30 * sc; x < W; x += 90 * sc) s += toon(rrectPath(x, ry + 20 * sc, 18 * sc, 180 * sc, 6), '#F4F1EA', { sw: 5, band: [4, 0], rim: false })
  // Çınar dalları ve ışık zinciri
  for (const side of [0, 1]) {
    const bx = side ? W : 0
    const dir = side ? -1 : 1
    for (let i = 0; i < 7; i++) {
      const lx = bx + dir * (40 + i * 60) * sc
      const ly = (60 + (i % 3) * 50) * sc
      s += toon(ellipsePath(lx, ly, 70 * sc, 50 * sc), i % 2 ? '#5E9C3A' : '#4E8A30', { sw: 6, band: [6, 6], rim: false })
    }
  }
  s += garland(W, 220 * sc, 90 * sc, '#3B2416')
  s += vignette(W, H)
  return s
}

function rize(W, H) {
  const CY = H * BG_COUNTER
  const sc = W / 1080
  const [sg, sgd] = lg([
    [0, '#8CC9E8'],
    [1, '#E6F5F2'],
  ])
  let s = sgd + `<rect x="0" y="0" width="${W}" height="${CY}" fill="url(#${sg})"/>`
  // Dağlar ve sis
  s += `<path d="M0 ${f(CY - 640 * sc)} L${f(W * 0.25)} ${f(CY - 860 * sc)} L${f(W * 0.5)} ${f(CY - 700 * sc)} L${f(W * 0.75)} ${f(CY - 900 * sc)} L${W} ${f(CY - 680 * sc)} V${CY} H0Z" fill="#7FA39A"/>`
  s += `<rect x="0" y="${f(CY - 700 * sc)}" width="${W}" height="${f(80 * sc)}" fill="#fff" opacity=".5" filter="url(#b14)"/>`
  // Çay bahçesi teraslı tepeler
  const hills = [
    ['#5E9C3A', CY - 560 * sc, 0.2],
    ['#4E8A30', CY - 420 * sc, 0.6],
    ['#3F7A28', CY - 280 * sc, 0.35],
  ]
  for (const [c, y, ph] of hills) {
    const d = `M0 ${f(y + 60 * sc)} Q${f(W * ph)} ${f(y - 80 * sc)} ${f(W * 0.6)} ${f(y)} T${W} ${f(y + 20 * sc)} V${CY} H0Z`
    s += toon(d, c, {
      sw: 6,
      band: [0, 10],
      inner: [...Array(14)].map((_, i) => `<path d="M-20 ${f(y + i * 30 * sc)} Q${f(W / 2)} ${f(y - 50 * sc + i * 30 * sc)} ${W + 20} ${f(y + i * 30 * sc)}" stroke="${shade(c, 1.25)}" stroke-width="${f(10 * sc)}" fill="none" opacity=".6"/>`).join(''),
    })
  }
  // Çardak kirişleri ve asma yaprakları
  s += toon(rrectPath(-10, 60 * sc, W + 20, 50 * sc, 10), '#8A5A33', { sw: 7, band: [0, 8] })
  for (const x of [80 * sc, W - 110 * sc]) s += toon(rrectPath(x, 60 * sc, 40 * sc, CY, 8), '#7A4E2C', { sw: 7, band: [8, 0] })
  const r = rng('vine' + W)
  for (let i = 0; i < 18; i++) {
    const x = r() * W
    const y = 100 * sc + r() * 120 * sc
    s += toon(ellipsePath(x, y, 34 * sc, 26 * sc), r() > 0.5 ? '#5E9C3A' : '#7BC043', { sw: 5, band: [4, 4], rim: false })
  }
  s += vignette(W, H)
  return s
}

function bogaz(W, H) {
  const CY = H * BG_COUNTER
  const sc = W / 1080
  let s = plaster(W, 0, CY, '#C9A57A', 'bogaz' + W)
  // İki büyük pencere
  const ww = W * 0.38
  const wh = 480 * sc
  const wy = CY - 760 * sc
  for (const wx of [W * 0.06, W * 0.56]) {
    const cid = 'bw' + Math.round(wx)
    s += `<clipPath id="${cid}"><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" rx="${f(40 * sc)}"/></clipPath>`
    const [sg, sgd] = lg([
      [0, '#6FB8E2'],
      [0.6, '#D6EEF8'],
      [0.61, '#2E7FAF'],
      [1, '#1B5F8C'],
    ])
    s += sgd + `<g clip-path="url(#${cid})"><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" fill="url(#${sg})"/>`
    // Köprü silueti
    const by = wy + wh * 0.6
    s += `<path d="M${f(wx - 20)} ${f(by - 30 * sc)} Q${f(wx + ww / 2)} ${f(by + 40 * sc)} ${f(wx + ww + 20)} ${f(by - 30 * sc)}" stroke="#4A5A6A" stroke-width="${f(6 * sc)}" fill="none"/>`
    s += `<path d="M${f(wx - 20)} ${f(by - 10 * sc)} H${f(wx + ww + 20)}" stroke="#4A5A6A" stroke-width="${f(8 * sc)}"/>`
    for (const tx of [wx + ww * 0.2, wx + ww * 0.8]) s += `<rect x="${f(tx)}" y="${f(by - 140 * sc)}" width="${f(12 * sc)}" height="${f(140 * sc)}" fill="#4A5A6A"/>`
    s += `<path d="M${f(wx + ww * 0.2)} ${f(by - 140 * sc)} Q${f(wx + ww / 2)} ${f(by - 30 * sc)} ${f(wx + ww * 0.8 + 12 * sc)} ${f(by - 140 * sc)}" stroke="#4A5A6A" stroke-width="${f(4 * sc)}" fill="none"/>`
    s += `<path d="M${f(wx + ww * 0.3)} ${f(wy + wh * 0.25)} q${f(14 * sc)} ${f(-14 * sc)} ${f(28 * sc)} 0 q${f(14 * sc)} ${f(-14 * sc)} ${f(28 * sc)} 0" fill="none" stroke="${OUT}" stroke-width="${f(5 * sc)}" stroke-linecap="round"/>`
    s += `</g>`
    s += `<path d="${rrectPath(wx, wy, ww, wh, 40 * sc)}" fill="none" stroke="${OUT}" stroke-width="${f(34 * sc)}"/><path d="${rrectPath(wx, wy, ww, wh, 40 * sc)}" fill="none" stroke="#E8E2D2" stroke-width="${f(22 * sc)}"/>`
    s += `<path d="M${f(wx + ww * 0.15)} ${f(wy + wh)} L${f(wx + ww * 0.5)} ${f(wy)} L${f(wx + ww * 0.62)} ${f(wy)} L${f(wx + ww * 0.27)} ${f(wy + wh)}Z" fill="#fff" opacity=".15"/>`
  }
  // Can simidi
  const lx = W * 0.5
  const ly = CY - 300 * sc
  s += toon(`${ellipsePath(lx, ly, 70 * sc, 70 * sc)} ${ellipsePath(lx, ly, 36 * sc, 36 * sc)}`, '#E8392F', {
    sw: 7,
    band: [6, 6],
    fillRule: 'evenodd',
    inner: [0, 1, 2, 3].map((i) => `<path d="M${lx} ${ly} L${f(lx + Math.cos((i * Math.PI) / 2 + 0.4) * 90 * sc)} ${f(ly + Math.sin((i * Math.PI) / 2 + 0.4) * 90 * sc)} L${f(lx + Math.cos((i * Math.PI) / 2 + 0.8) * 90 * sc)} ${f(ly + Math.sin((i * Math.PI) / 2 + 0.8) * 90 * sc)}Z" fill="#fff"/>`).join(''),
  })
  // Ahşap lambri
  s += `<rect x="0" y="${f(CY - 200 * sc)}" width="${W}" height="${f(H)}" fill="#8A5A33"/>`
  for (let x = 0; x < W; x += 120 * sc) s += `<rect x="${f(x)}" y="${f(CY - 200 * sc)}" width="${f(6 * sc)}" height="${f(H)}" fill="${OUT}" opacity=".4"/>`
  s += toon(rrectPath(-10, CY - 210 * sc, W + 20, 26 * sc, 6), '#6E4426', { sw: 6, band: [0, 6] })
  s += ceiling(W, 120 * sc, '#5E3E26')
  s += lamp(W * 0.5, 100 * sc, 120 * sc, sc * 0.85)
  s += vignette(W, H)
  return s
}

const VENUE_FN = { mahalle, sahil, rize, bogaz }

register(
  (id) => id.startsWith('bg_'),
  (a, ctx) => {
    const venue = a.id.split('_')[1]
    const fn = VENUE_FN[venue] ?? mahalle
    return { svg: svg(a.w, a.h, fn(a.w, a.h, ctx.theme)), meta: { counterY: BG_COUNTER } }
  },
)

export { mix, f }
