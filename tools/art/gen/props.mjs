// Sahne eşyaları (saydam): tabak, şekerlik, şeker, kaşık, askılı tepsi. Yandan ~15° yukarıdan.

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, shade, silhouette, smoothPath, svg } from '../lib/svg.mjs'

const K = 0.27 // elips oranı (15°)

function tabak() {
  const cx = 256
  const cy = 262
  const rx = 234
  const ry = rx * K
  const side = 18
  const outer = ellipsePath(cx, cy, rx, ry)
  const under = `M${cx - rx} ${cy} L${cx - rx + 26} ${cy + side} Q${cx} ${cy + ry + side + 14} ${cx + rx - 26} ${cy + side} L${cx + rx} ${cy} Q${cx} ${cy + ry * 2.1} ${cx - rx} ${cy}Z`
  let s = silhouette([outer, under], 16)
  s += cel(under, '#E7EAEE', { sw: 7, shadow: 0.85 })
  s += cel(outer, '#FBFBF8', {
    sw: 7,
    shadow: 0.9,
    off: [-10, -6],
    hl: [cx - 110, cy - 18, 70, 12],
    hlOpacity: 0.7,
    inner:
      `<path d="${ellipsePath(cx, cy + 2, rx * 0.62, ry * 0.62)}" fill="#ECEFF2"/>` +
      `<path d="${ellipsePath(cx, cy + 4, rx * 0.44, ry * 0.44)}" fill="#F7F8F9" stroke="#D9DEE3" stroke-width="4"/>`,
  })
  s += `<path d="${ellipsePath(cx, cy, rx - 16, ry - 5)}" fill="none" stroke="${C.gold}" stroke-width="5"/>`
  s += `<path d="${ellipsePath(cx, cy, rx - 8, ry - 2.5)}" fill="none" stroke="#E9C766" stroke-width="2" opacity=".7"/>`
  return svg(512, 512, s)
}

function seker(size = 128) {
  const s0 = size / 128
  const top = `M${64 * s0} ${18 * s0} L${108 * s0} ${36 * s0} L${64 * s0} ${56 * s0} L${20 * s0} ${36 * s0}Z`
  const left = `M${20 * s0} ${36 * s0} L${64 * s0} ${56 * s0} L${64 * s0} ${110 * s0} L${20 * s0} ${88 * s0}Z`
  const right = `M${108 * s0} ${36 * s0} L${64 * s0} ${56 * s0} L${64 * s0} ${110 * s0} L${108 * s0} ${88 * s0}Z`
  const grains = Array.from({ length: 18 }, (_, i) => {
    const x = (24 + ((i * 37) % 80)) * s0
    const y = (40 + ((i * 53) % 64)) * s0
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 * s0)}" fill="#D8D2C4"/>`
  }).join('')
  return (
    silhouette([`M${64 * s0} ${18 * s0} L${108 * s0} ${36 * s0} L${108 * s0} ${88 * s0} L${64 * s0} ${110 * s0} L${20 * s0} ${88 * s0} L${20 * s0} ${36 * s0}Z`], 7 * s0) +
    `<path d="${left}" fill="#EDE8DC"/><path d="${right}" fill="#D9D3C5"/><path d="${top}" fill="#FFFFFF"/>${grains}` +
    `<path d="${top} ${left} ${right}" fill="none" stroke="${C.out}" stroke-width="${5 * s0}" stroke-linejoin="round"/>`
  )
}

function sekerlik() {
  const cx = 256
  const top = 230
  const bot = 420
  const rx = 190
  const bowl = `M${cx - rx} ${top} Q${cx - rx + 10} ${bot - 40} ${cx - 90} ${bot} L${cx + 90} ${bot} Q${cx + rx - 10} ${bot - 40} ${cx + rx} ${top}Z`
  const rim = ellipsePath(cx, top, rx, rx * K)
  const foot = `M${cx - 96} ${bot - 6} L${cx - 110} ${bot + 34} Q${cx} ${bot + 56} ${cx + 110} ${bot + 34} L${cx + 96} ${bot - 6}Z`
  let s = silhouette([bowl, rim, foot], 16)
  // Küpler (kasenin içinde, üstte yığın)
  const cubes = [
    [150, 150, 0.95, -8],
    [232, 132, 1, 6],
    [312, 150, 0.95, 10],
    [196, 186, 1, -4],
    [276, 182, 1, 4],
  ]
  let cs = ''
  for (const [x, y, sc, rot] of cubes) {
    cs += `<g transform="translate(${x - 52 * sc} ${y - 52 * sc}) rotate(${rot} 52 52) scale(${(sc * 104) / 128})">${seker(128)}</g>`
  }
  s += cel(foot, '#D6EEF2', { sw: 7, shadow: 0.85, hl: [cx - 60, bot + 10, 30, 8] })
  // Arka cam duvarı
  s += `<path d="${ellipsePath(cx, top, rx - 8, rx * K - 3)}" fill="#E8F6F8" opacity=".55"/>`
  s += cs
  // Ön cam (yarı saydam) + kesme cam yüzeyleri
  const facets = Array.from({ length: 7 }, (_, i) => {
    const x = cx - 150 + i * 50
    return `<path d="M${x} ${top + 30} L${x + 14} ${bot - 20}" stroke="#FFFFFF" stroke-width="6" opacity=".55"/>`
  }).join('')
  s += cel(bowl, '#BFE3EA', { sw: 7, shadow: 0.82, off: [16, 6], hl: [cx - 110, top + 60, 30, 60], hlOpacity: 0.7, inner: facets })
  s = s.replace(/fill="#BFE3EA"/g, 'fill="#BFE3EA" fill-opacity=".72"')
  s += `<path d="${rim}" fill="none" stroke="${C.out}" stroke-width="7"/><path d="${ellipsePath(cx, top + 2, rx - 10, rx * K - 4)}" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`
  return svg(512, 512, s)
}

function kasik() {
  // Çapraz duran çay kaşığı: hazne sol altta, sap sağ üstte
  const bowl = ellipsePath(78, 182, 40, 54)
  const handle = `M98 140 C120 110 150 86 196 44 C206 36 220 40 214 54 C176 96 140 130 112 160Z`
  let s = silhouette([handle, bowl], 12)
  s = `<g transform="rotate(-8 128 128)">` + s
  s += cel(handle, '#C6CED6', { sw: 6, hl: [160, 80, 30, 6], hlOpacity: 0.8, inner: `<path d="M110 136 C140 106 170 82 204 50" stroke="#fff" stroke-width="5" opacity=".6"/>` })
  s += `<g transform="rotate(35 78 182)">` + cel(bowl, '#C6CED6', { sw: 6, off: [8, 8], hl: [66, 160, 14, 22], hlOpacity: 0.8, inner: `<path d="${ellipsePath(82, 186, 26, 38)}" fill="#A9B3BD"/>` }) + `</g>`
  s += `</g>`
  return svg(256, 256, s)
}

function tepsi() {
  const cx = 384
  const ty = 600
  const rx = 330
  const ry = rx * K
  const side = 26
  const top = ellipsePath(cx, ty, rx, ry)
  const under = `M${cx - rx} ${ty} L${cx - rx + 10} ${ty + side} Q${cx} ${ty + ry + side + 18} ${cx + rx - 10} ${ty + side} L${cx + rx} ${ty} Q${cx} ${ty + ry * 2} ${cx - rx} ${ty}Z`
  const ringY = 70
  // Askı kolları: kenardaki üç noktadan tepedeki halkaya
  const arms = [
    [cx - rx + 24, ty - 6],
    [cx + rx - 24, ty - 6],
    [cx, ty - ry + 6],
  ]
  let s = silhouette([top, under], 18)
  for (const [ax, ay] of arms) {
    const d = `M${ax} ${ay} C${ax + (cx - ax) * 0.1} ${ay - 220} ${cx + (ax - cx) * 0.35} ${ringY + 120} ${cx} ${ringY + 34}`
    s += line(d, 26, C.out) + line(d, 14, '#D9B13A') + line(d, 4, '#F6DB82', 'opacity=".9" transform="translate(-3 -2)"')
  }
  s += cel(ellipsePath(cx, ringY, 34, 34), '#D9B13A', { sw: 9, noShadow: true }) + `<circle cx="${cx}" cy="${ringY}" r="18" fill="none" stroke="${C.out}" stroke-width="7"/><circle cx="${cx}" cy="${ringY}" r="18" fill="#00000000"/>`
  s = s.replace(`<circle cx="${cx}" cy="${ringY}" r="18" fill="#00000000"/>`, '')
  // Halkanın ortası boş görünsün
  s += `<circle cx="${cx}" cy="${ringY}" r="15" fill="none"/>`
  s += cel(under, '#B98F24', { sw: 8, shadow: 0.85 })
  const engraving = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return `<path d="M${f(cx + Math.cos(a) * rx * 0.3)} ${f(ty + Math.sin(a) * ry * 0.3)} L${f(cx + Math.cos(a) * rx * 0.62)} ${f(ty + Math.sin(a) * ry * 0.62)}" stroke="#A88316" stroke-width="4"/>`
  }).join('')
  s += cel(top, '#D9B13A', {
    sw: 8,
    shadow: 0.88,
    off: [-14, -6],
    hl: [cx - 150, ty - 26, 90, 14],
    hlOpacity: 0.6,
    inner: `<path d="${ellipsePath(cx, ty + 4, rx * 0.86, ry * 0.86)}" fill="#C99F2C"/>${engraving}<path d="${ellipsePath(cx, ty + 4, rx * 0.3, ry * 0.3)}" fill="none" stroke="#A88316" stroke-width="5"/>`,
  })
  s += `<path d="${ellipsePath(cx, ty, rx - 12, ry - 4)}" fill="none" stroke="#F6DB82" stroke-width="4" opacity=".8"/>`
  return svg(768, 768, s)
}

register((id) => id === 'prop_tabak', () => tabak())
register((id) => id === 'prop_seker', () => svg(128, 128, `<g transform="translate(0 4)">${seker(128)}</g>`))
register((id) => id === 'prop_sekerlik', () => sekerlik())
register((id) => id === 'prop_kasik', () => kasik())
register((id) => id === 'prop_tepsi', () => tepsi())

export { seker as sugarCubeSvg, shade, smoothPath }
