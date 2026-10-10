// v2 sahne eşyaları (saydam): tezgâh, çay tabağı, şekerlik, kesme şeker, kaşık, askılı tepsi.
// Yandan ~15° yukarıdan bakış, parlak cartoon gölgelendirme.

import { register } from './index.mjs'
import { C, ellipsePath, f, newId, rng, rrectPath, shade, svg } from '../lib/svg.mjs'
import { contactShadow, lg, rg, toon } from '../lib/toon.mjs'
import { GLASS_K, saucerSvg, spoonSvg } from '../lib/teaGlass.mjs'

const OUT = C.out

/** Tezgâh üstü: arka kenar pirinç boru (y=0) + perspektifli tahtalar + yuvarlak ön dudak (alt 70 px). */
function tezgahUst(W, H) {
  const lip = 70
  const top = H - lip
  const r = rng('tezgah')
  let s = ''
  const planks = [0.09, 0.11, 0.13, 0.15, 0.18, 0.2]
  const sum = planks.reduce((a, b) => a + b, 0)
  let y = 14
  planks.forEach((p, i) => {
    const h = ((top - 14) * p) / sum
    const c = ['#A86A3C', '#B27442', '#A0643A', '#B87A46', '#AA6E3E', '#B47644'][i]
    const [g, gd] = lg([
      [0, shade(c, 1.08)],
      [1, shade(c, 0.92)],
    ])
    s += gd + `<rect x="0" y="${f(y)}" width="${W}" height="${f(h + 1)}" fill="url(#${g})"/>`
    for (let k = 0; k < 6; k++) {
      const yy = y + r() * h
      const x0 = r() * W
      s += `<path d="M${f(x0)} ${f(yy)} q${f(120 + r() * 160)} ${f((r() - 0.5) * 6)} ${f(300 + r() * 200)} 0" stroke="#5A3418" stroke-width="${f(2 + r() * 2)}" fill="none" opacity=".18"/>`
    }
    s += `<rect x="0" y="${f(y + h - 2)}" width="${W}" height="3" fill="#5A3418" opacity=".45"/>`
    y += h
  })
  // Cilalı yüzeyde ince, yatay ışık çizgileri (lamba yansıması)
  s += `<rect x="${f(W * 0.18)}" y="${f(top * 0.3)}" width="${f(W * 0.64)}" height="${f(top * 0.05)}" rx="${f(top * 0.025)}" fill="#FFF3D6" opacity=".14" filter="url(#b4)"/>`
  s += `<rect x="${f(W * 0.3)}" y="${f(top * 0.62)}" width="${f(W * 0.4)}" height="${f(top * 0.035)}" rx="${f(top * 0.02)}" fill="#FFF3D6" opacity=".1" filter="url(#b4)"/>`
  // Arka kenar: koyu şerit + pirinç boru
  s += `<rect x="0" y="0" width="${W}" height="18" fill="#3B2416"/>`
  s += `<rect x="0" y="18" width="${W}" height="22" fill="#000" opacity=".18" filter="url(#b4)"/>`
  const [bg, bgd] = lg([
    [0, '#FFF0B0'],
    [0.4, '#E2B33C'],
    [1, '#9A7416'],
  ])
  s += bgd + `<rect x="-10" y="2" width="${W + 20}" height="14" rx="7" fill="url(#${bg})" stroke="${OUT}" stroke-width="4"/>`
  // Ön dudak
  const [lgId, lgd] = lg([
    [0, '#D69A5E'],
    [0.35, '#B87A46'],
    [1, '#6E4224'],
  ])
  s += lgd + `<rect x="-10" y="${f(top - 6)}" width="${W + 20}" height="${lip + 20}" rx="20" fill="url(#${lgId})" stroke="${OUT}" stroke-width="6"/>`
  s += `<rect x="20" y="${f(top + 2)}" width="${W - 40}" height="8" rx="4" fill="#fff" opacity=".35"/>`
  return s
}

/** Tezgâh önü: pirinç şerit + kabartma paneller (dikeyde esnetilir). */
function tezgahOn(W, H) {
  const [pg, pgd] = lg([
    [0, '#5E381E'],
    [1, '#3E2412'],
  ])
  let s = pgd + `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${pg})"/>`
  s += `<rect x="0" y="0" width="${W}" height="50" fill="#000" opacity=".35" filter="url(#b8)"/>`
  const [bg, bgd] = lg([
    [0, '#FFF0B0'],
    [0.4, '#E2B33C'],
    [1, '#9A7416'],
  ])
  s += bgd + `<rect x="-10" y="16" width="${W + 20}" height="14" fill="url(#${bg})" stroke="${OUT}" stroke-width="3"/>`
  const n = 3
  const gap = 34
  const pw = (W - gap * (n + 1)) / n
  const ph = H - 140
  for (let i = 0; i < n; i++) {
    const x = gap + i * (pw + gap)
    const yy = 64
    s += toon(rrectPath(x, yy, pw, ph, 18), '#6A4022', { sw: 6, band: [-8, -8], bandTone: 0.85, light: 1.18, rim: true, rimOpacity: 0.3 })
    s += `<path d="${rrectPath(x + 26, yy + 26, pw - 52, ph - 52, 12)}" fill="#583318" stroke="#2E1A0C" stroke-width="4" opacity=".9"/>`
  }
  s += `<rect x="0" y="${f(H - 40)}" width="${W}" height="40" fill="#2A1608"/>`
  return s
}

function tabak(W, H) {
  return saucerSvg(W / 2, H * 0.5, W * 0.46, { sw: 7 })
}

function seker(W) {
  const s0 = W / 128
  const p = (x, y) => `${f(x * s0)} ${f(y * s0)}`
  const top = `M${p(64, 16)} L${p(110, 36)} L${p(64, 56)} L${p(18, 36)}Z`
  const left = `M${p(18, 36)} L${p(64, 56)} L${p(64, 112)} L${p(18, 90)}Z`
  const right = `M${p(110, 36)} L${p(64, 56)} L${p(64, 112)} L${p(110, 90)}Z`
  let s = contactShadow(64 * s0, 108 * s0, 44 * s0, 10 * s0, 0.25)
  s += `<path d="${left}" fill="#EFEAE0"/><path d="${right}" fill="#D8D1C2"/><path d="${top}" fill="#FFFFFF"/>`
  const r = rng('seker')
  for (let i = 0; i < 20; i++) s += `<circle cx="${f((22 + r() * 84) * s0)}" cy="${f((40 + r() * 66) * s0)}" r="${f(1.6 * s0)}" fill="#CFC6B3"/>`
  s += `<path d="M${p(30, 34)} L${p(62, 22)}" stroke="#fff" stroke-width="${f(5 * s0)}" stroke-linecap="round" opacity=".9"/>`
  s += `<path d="${top} ${left} ${right}" fill="none" stroke="${OUT}" stroke-width="${f(5 * s0)}" stroke-linejoin="round"/>`
  return s
}

function sekerlik(W) {
  // Tabakla takım porselen şekerlik: beyaz gövde, kırmızı bant + altın çizgi, kısa ayak, tepeleme kesme şeker.
  const cx = W / 2
  const s0 = W / 512
  const top = 250 * s0
  const bot = 420 * s0
  const rx = 200 * s0
  const k = GLASS_K
  const sw = 9 * s0
  let s = `<ellipse cx="${f(cx)}" cy="${f(bot + 36 * s0)}" rx="${f(rx * 0.85)}" ry="${f(30 * s0)}" fill="#2A1408" opacity=".25"/>`
  // Ayak
  const foot = `M${f(cx - 88 * s0)} ${f(bot - 8 * s0)} L${f(cx - 100 * s0)} ${f(bot + 26 * s0)} A${f(100 * s0)} ${f(100 * s0 * k)} 0 0 0 ${f(cx + 100 * s0)} ${f(bot + 26 * s0)} L${f(cx + 88 * s0)} ${f(bot - 8 * s0)}Z`
  s += `<path d="${foot}" fill="#E3E9EE" stroke="${OUT}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`
  // Gövde (yuvarlak kase)
  const bowl = `M${f(cx - rx)} ${f(top)} C${f(cx - rx)} ${f(bot - 30 * s0)} ${f(cx - 110 * s0)} ${f(bot)} ${f(cx - 70 * s0)} ${f(bot)} L${f(cx + 70 * s0)} ${f(bot)} C${f(cx + 110 * s0)} ${f(bot)} ${f(cx + rx)} ${f(bot - 30 * s0)} ${f(cx + rx)} ${f(top)} A${f(rx)} ${f(rx * k)} 0 0 1 ${f(cx - rx)} ${f(top)}Z`
  const bid = newId('sb')
  s += `<clipPath id="${bid}"><path d="${bowl}"/></clipPath>`
  s += `<path d="${bowl}" fill="#F7F9FA"/>`
  s += `<g clip-path="url(#${bid})">`
  // Sağda düz gölge bandı
  s += `<ellipse cx="${f(cx + rx * 0.95)}" cy="${f((top + bot) / 2 + 20 * s0)}" rx="${f(rx * 0.55)}" ry="${f((bot - top) * 0.8)}" fill="#DCE4EA"/>`
  // Kırmızı bant ve altın çizgi (ağzın altında)
  s += `<path d="M${f(cx - rx - 4 * s0)} ${f(top + 34 * s0)} A${f(rx + 4 * s0)} ${f((rx + 4 * s0) * k)} 0 0 0 ${f(cx + rx + 4 * s0)} ${f(top + 34 * s0)}" fill="none" stroke="#D23B2B" stroke-width="${f(26 * s0)}"/>`
  s += `<path d="M${f(cx - rx - 4 * s0)} ${f(top + 62 * s0)} A${f(rx + 4 * s0)} ${f((rx + 4 * s0) * k)} 0 0 0 ${f(cx + rx + 4 * s0)} ${f(top + 62 * s0)}" fill="none" stroke="#F2C14E" stroke-width="${f(7 * s0)}"/>`
  // Lale motifi (ön yüz ortası)
  const ty = top + 112 * s0
  s += `<path d="M${f(cx)} ${f(ty + 40 * s0)} C${f(cx - 26 * s0)} ${f(ty + 20 * s0)} ${f(cx - 26 * s0)} ${f(ty - 14 * s0)} ${f(cx - 14 * s0)} ${f(ty - 22 * s0)} L${f(cx)} ${f(ty - 6 * s0)} L${f(cx + 14 * s0)} ${f(ty - 22 * s0)} C${f(cx + 26 * s0)} ${f(ty - 14 * s0)} ${f(cx + 26 * s0)} ${f(ty + 20 * s0)} ${f(cx)} ${f(ty + 40 * s0)}Z" fill="#D23B2B" stroke="${OUT}" stroke-width="${f(5 * s0)}" stroke-linejoin="round"/>`
  s += `<path d="M${f(cx)} ${f(ty + 40 * s0)} L${f(cx)} ${f(ty + 70 * s0)}" stroke="#4E9A3A" stroke-width="${f(7 * s0)}" stroke-linecap="round"/>`
  // Sol parlama
  s += `<path d="M${f(cx - rx * 0.78)} ${f(top + 90 * s0)} Q${f(cx - rx * 0.74)} ${f(bot - 50 * s0)} ${f(cx - rx * 0.45)} ${f(bot - 22 * s0)}" fill="none" stroke="#fff" stroke-width="${f(16 * s0)}" stroke-linecap="round"/>`
  s += `</g>`
  s += `<path d="${bowl}" fill="none" stroke="${OUT}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`
  // İç (arka yarı gölgede) ve tepeleme kesme şeker
  s += `<path d="${ellipsePath(cx, top, rx - 6 * s0, (rx - 6 * s0) * k)}" fill="#C9D3DA"/>`
  const cubes = [
    [-118, 6],
    [-50, 14],
    [22, 14],
    [94, 6],
    [-86, -40],
    [-14, -36],
    [58, -40],
    [-50, -84],
    [22, -82],
    [-14, -126],
  ]
  for (const [dx, dy] of cubes) s += `<g transform="translate(${f(cx + dx * s0 - 42 * s0)} ${f(top + dy * s0 - 62 * s0)}) scale(${f(0.66 * s0)})">${seker(128)}</g>`
  // Ön dudak (küplerin altını örter) + kontur
  s += `<path d="M${f(cx - rx + 4 * s0)} ${f(top)} A${f(rx - 4 * s0)} ${f((rx - 4 * s0) * k)} 0 0 0 ${f(cx + rx - 4 * s0)} ${f(top)}" fill="none" stroke="#F7F9FA" stroke-width="${f(18 * s0)}"/>`
  s += `<path d="${ellipsePath(cx, top, rx, rx * k)}" fill="none" stroke="${OUT}" stroke-width="${f(sw)}"/>`
  s += `<ellipse cx="${f(cx - rx * 0.55)}" cy="${f(top + rx * k * 0.75)}" rx="${f(26 * s0)}" ry="${f(8 * s0)}" fill="#fff"/>`
  return s
}

function kasik(W) {
  return spoonSvg(W * 0.5, W * 0.5, W * 0.9, 7 * (W / 256))
}

function tepsi(W) {
  const cx = W / 2
  const s0 = W / 768
  const ty = 560 * s0
  const rx = 300 * s0
  const k = GLASS_K
  const [gg, ggd] = lg([
    [0, '#FFF0B0'],
    [0.4, '#E2B33C'],
    [1, '#9A7416'],
  ])
  let s = ggd + contactShadow(cx, ty + 50 * s0, rx, 40 * s0, 0.3)
  // Askı kolları
  for (const side of [-1, 1]) s += `<path d="M${f(cx + side * rx * 0.9)} ${f(ty)} Q${f(cx + side * rx * 0.75)} ${f(200 * s0)} ${f(cx)} ${f(90 * s0)}" fill="none" stroke="${OUT}" stroke-width="${f(22 * s0)}" stroke-linecap="round"/><path d="M${f(cx + side * rx * 0.9)} ${f(ty)} Q${f(cx + side * rx * 0.75)} ${f(200 * s0)} ${f(cx)} ${f(90 * s0)}" fill="none" stroke="url(#${gg})" stroke-width="${f(10 * s0)}" stroke-linecap="round"/>`
  s += toon(ellipsePath(cx, 80 * s0, 40 * s0, 40 * s0), '#E2B33C', { sw: 8, band: [4, 4] })
  s += `<circle cx="${cx}" cy="${f(80 * s0)}" r="${f(18 * s0)}" fill="#3B2416"/>`
  // Tepsi
  s += `<path d="M${f(cx - rx)} ${f(ty)} A${f(rx)} ${f(rx * k)} 0 0 0 ${f(cx + rx)} ${f(ty)} L${f(cx + rx * 0.96)} ${f(ty + 26 * s0)} A${f(rx * 0.96)} ${f(rx * k * 0.96)} 0 0 1 ${f(cx - rx * 0.96)} ${f(ty + 26 * s0)}Z" fill="#9A7416" stroke="${OUT}" stroke-width="${f(7 * s0)}"/>`
  s += toon(ellipsePath(cx, ty, rx, rx * k), '#E2B33C', { sw: 8, band: [0, -10], dir: 'v', spec: [[cx - rx * 0.5, ty - rx * k * 0.4, rx * 0.25, rx * k * 0.15, 0, 0.6]] })
  s += `<path d="${ellipsePath(cx, ty, rx * 0.84, rx * k * 0.84)}" fill="none" stroke="#9A7416" stroke-width="${f(6 * s0)}"/>`
  return s
}

register(
  (id) => id.startsWith('prop_'),
  (a) => {
    const W = a.w
    const H = a.h
    let body = ''
    if (a.id === 'prop_tezgah_ust') return svg(W, H, tezgahUst(W, H))
    if (a.id === 'prop_tezgah_on') return svg(W, H, tezgahOn(W, H))
    if (a.id === 'prop_tabak') body = tabak(W, H)
    else if (a.id === 'prop_seker') body = seker(W)
    else if (a.id === 'prop_sekerlik') body = sekerlik(W)
    else if (a.id === 'prop_kasik') body = kasik(W)
    else if (a.id === 'prop_tepsi') body = tepsi(W)
    return svg(W, H, body)
  },
)

export { rg }
