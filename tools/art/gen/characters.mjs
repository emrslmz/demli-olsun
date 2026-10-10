// v2 müşteriler: büyük kafalı, ifadeli, parlak cartoon; belden yukarı (tezgâhın arkasında durur).
// 768×768 çizim alanı, çıktı katalogdaki boyuta ölçeklenir. Işık sol üstten.
// Her müşteri 3 ifade (neutral, happy, angry) × 4 tema (temada aksesuar değişir).

import { register } from './index.mjs'
import { C, ellipsePath, f, mix, newId, shade, smoothPath } from '../lib/svg.mjs'
import { contactShadow, lg, toon } from '../lib/toon.mjs'

const V = 768
const CX = 384
const HY = 300 // baş merkezi

function svgV(w, h, body) {
  const filters = [2, 3, 4, 6, 8, 14]
    .map((b) => `<filter id="b${b}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${b}"/></filter>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${V} ${V}"><defs>${filters}</defs>${body}</svg>`
}

const OUT = C.out
const HEAD = '<!--HEAD-->'
const SW = 7

// ---------- Baş ve gövde ----------

function headPath({ w = 150, top = 128, chin = 468, jaw = 0.78, cheek = 1 } = {}) {
  const pts = [
    [0, top],
    [w * 0.66, top + 14],
    [w * 0.97, top + 96],
    [w * cheek, HY + 8],
    [w * 0.95 * cheek, HY + 78],
    [w * jaw, HY + 132],
    [w * 0.4, chin - 10],
  ]
  const right = pts.map(([x, y]) => [CX + x, y])
  const left = pts
    .slice(1)
    .reverse()
    .map(([x, y]) => [CX - x, y])
  return smoothPath([...right, [CX, chin], ...left], true, 0.62)
}

function neck(skin, w = 64, top = 420, bottom = 560) {
  const d = `M${CX - w} ${top} L${CX - w - 6} ${bottom} L${CX + w + 6} ${bottom} L${CX + w} ${top}Z`
  return toon(d, shade(skin, 0.9), { sw: SW, band: [0, 0], rim: false }) + `<path d="M${CX - w} ${top + 28} Q${CX} ${top + 78} ${CX + w} ${top + 28}" fill="${shade(skin, 0.7)}" opacity=".55" filter="url(#b4)"/>`
}

/** Omuzlar ve gövde (kıyafet). Üst kenar: yaka hizası. */
function torsoPath(top = 520, wide = 1, slope = 1) {
  const sh = 268 * wide
  return smoothPath(
    [
      [CX - 70, top],
      [CX - sh * 0.62, top + 22 * slope],
      [CX - sh * 0.95, top + 70 * slope],
      [CX - sh * 1.08, top + 170],
      [CX - sh * 1.14, V + 30],
      [CX + sh * 1.14, V + 30],
      [CX + sh * 1.08, top + 170],
      [CX + sh * 0.95, top + 70 * slope],
      [CX + sh * 0.62, top + 22 * slope],
      [CX + 70, top],
    ],
    true,
    0.5,
  )
}

function ears(skin, y = HY + 20, x = 150, r = 1) {
  let s = ''
  for (const side of [-1, 1]) {
    const ex = CX + side * x
    const d = smoothPath([
      [ex - side * 8, y - 44 * r],
      [ex + side * 22, y - 40 * r],
      [ex + side * 34, y - 4],
      [ex + side * 22, y + 38 * r],
      [ex - side * 8, y + 36 * r],
    ])
    s += toon(d, skin, { sw: SW, band: [side * -6, 6], rim: false })
    s += `<path d="M${f(ex + side * 4)} ${f(y - 22 * r)} Q${f(ex + side * 22)} ${f(y)} ${f(ex + side * 6)} ${f(y + 20 * r)}" fill="none" stroke="${shade(skin, 0.62)}" stroke-width="6" stroke-linecap="round"/>`
  }
  return s
}

function face(skin, shape) {
  const d = headPath(shape)
  return toon(d, skin, { sw: SW + 1, band: [12, 6], bandTone: 0.95, light: 1.12, rimOpacity: 0.45 })
}

// ---------- Yüz parçaları ----------

function eyes(expr, { y = HY + 6, gap = 64, rx = 33, ry = 40, iris = '#4A2A16', skin = '#F0C090', look = 0 } = {}) {
  let s = ''
  for (const side of [-1, 1]) {
    const x = CX + side * gap
    if (expr === 'happy') {
      s += `<path d="M${f(x - rx * 0.9)} ${f(y + 8)} Q${f(x)} ${f(y - ry * 0.95)} ${f(x + rx * 0.9)} ${f(y + 8)}" fill="none" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/>`
      s += `<path d="M${f(x - rx * 0.55)} ${f(y + 26)} Q${f(x)} ${f(y + 34)} ${f(x + rx * 0.55)} ${f(y + 26)}" fill="none" stroke="${shade(skin, 0.7)}" stroke-width="5" stroke-linecap="round" opacity=".7"/>`
      continue
    }
    const cid = newId('ey')
    const sclera = ellipsePath(x, y, rx, ry)
    s += `<clipPath id="${cid}"><path d="${sclera}"/></clipPath>`
    s += `<path d="${sclera}" fill="#FFFFFF"/>`
    s += `<g clip-path="url(#${cid})">`
    s += `<ellipse cx="${x}" cy="${y - ry * 0.6}" rx="${rx}" ry="${ry * 0.5}" fill="#C9D3E0" opacity=".45"/>`
    const ir = expr === 'angry' ? rx * 0.52 : rx * 0.64
    const ix = x + look * 8 - side * 3
    const iy = y + (expr === 'angry' ? 6 : 4)
    const [ig, igd] = lg(
      [
        [0, shade(iris, 1.5)],
        [1, shade(iris, 0.8)],
      ],
      0,
      1,
      0,
      0,
    )
    s += igd + `<circle cx="${f(ix)}" cy="${f(iy)}" r="${f(ir)}" fill="url(#${ig})"/>`
    s += `<circle cx="${f(ix)}" cy="${f(iy)}" r="${f(ir * 0.5)}" fill="#160C06"/>`
    s += `<circle cx="${f(ix - ir * 0.35)}" cy="${f(iy - ir * 0.38)}" r="${f(ir * 0.34)}" fill="#fff"/>`
    s += `<circle cx="${f(ix + ir * 0.38)}" cy="${f(iy + ir * 0.34)}" r="${f(ir * 0.15)}" fill="#fff" opacity=".9"/>`
    if (expr === 'angry') {
      // Göz kapağı: içe doğru eğik
      const inner = side === -1 ? 1 : -1
      s += `<path d="M${f(x - rx - 4)} ${f(y - ry - 4)} L${f(x + rx + 4)} ${f(y - ry - 4)} L${f(x + rx + 4)} ${f(y - ry * (inner === 1 ? 0.55 : 0.05))} L${f(x - rx - 4)} ${f(y - ry * (inner === 1 ? 0.05 : 0.55))}Z" fill="${skin}"/>`
    } else {
      s += `<path d="M${f(x - rx - 4)} ${f(y - ry - 4)} L${f(x + rx + 4)} ${f(y - ry - 4)} L${f(x + rx + 4)} ${f(y - ry * 0.72)} Q${f(x)} ${f(y - ry * 0.95)} ${f(x - rx - 4)} ${f(y - ry * 0.72)}Z" fill="${skin}"/>`
    }
    s += `</g>`
    s += `<path d="${sclera}" fill="none" stroke="${OUT}" stroke-width="6"/>`
    // Üst kapak çizgisi
    if (expr === 'angry') {
      const inner = side === -1 ? 1 : -1
      s += `<path d="M${f(x - rx - 2)} ${f(y - ry * (inner === 1 ? 0.05 : 0.55))} L${f(x + rx + 2)} ${f(y - ry * (inner === 1 ? 0.55 : 0.05))}" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/>`
    } else {
      s += `<path d="M${f(x - rx - 3)} ${f(y - ry * 0.68)} Q${f(x)} ${f(y - ry * 0.98)} ${f(x + rx + 3)} ${f(y - ry * 0.68)}" fill="none" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>`
    }
  }
  return s
}

function brows(expr, { y = HY - 58, gap = 64, color = '#3B2416', w = 44, thick = 14, bushy = false } = {}) {
  let s = ''
  for (const side of [-1, 1]) {
    const x = CX + side * gap
    let x1 = x - w * side * -1
    let x2 = x + w * side * -1
    let y1 = y
    let y2 = y
    let ym = y - 12
    // x1: iç uç, x2: dış uç
    x1 = CX + side * (gap - w)
    x2 = CX + side * (gap + w)
    if (expr === 'angry') {
      y1 = y + 18
      y2 = y - 14
      ym = y - 2
    } else if (expr === 'happy') {
      y1 = y - 10
      y2 = y - 6
      ym = y - 30
    }
    if (bushy) {
      const pts = []
      for (let i = 0; i <= 6; i++) {
        const t = i / 6
        const bx = x1 + (x2 - x1) * t
        const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * ym + t * t * y2
        pts.push([bx, by])
      }
      for (const [bx, by] of pts) s += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${thick * 1.05}" ry="${thick * 0.85}" fill="${OUT}"/>`
      for (const [bx, by] of pts) s += `<ellipse cx="${f(bx)}" cy="${f(by - 1)}" rx="${thick * 0.8}" ry="${thick * 0.62}" fill="${color}"/>`
      for (const [bx, by] of pts.slice(1, 5)) s += `<ellipse cx="${f(bx - 4)}" cy="${f(by - 5)}" rx="${thick * 0.35}" ry="${thick * 0.2}" fill="#fff" opacity=".5"/>`
    } else {
      s += `<path d="M${f(x1)} ${f(y1)} Q${f(x)} ${f(ym)} ${f(x2)} ${f(y2)}" fill="none" stroke="${OUT}" stroke-width="${thick + 6}" stroke-linecap="round"/>`
      s += `<path d="M${f(x1)} ${f(y1)} Q${f(x)} ${f(ym)} ${f(x2)} ${f(y2)}" fill="none" stroke="${color}" stroke-width="${thick}" stroke-linecap="round"/>`
    }
  }
  return s
}

function nose(skin, { y = HY + 62, w = 30, h = 26 } = {}) {
  const d = smoothPath([
    [CX, y - h * 1.6],
    [CX + w * 0.55, y - h * 0.2],
    [CX + w, y + h * 0.45],
    [CX + w * 0.5, y + h],
    [CX - w * 0.5, y + h],
    [CX - w, y + h * 0.45],
    [CX - w * 0.55, y - h * 0.2],
  ])
  return (
    toon(d, shade(skin, 0.98), { sw: 6, band: [7, 4], rim: false, spec: [[CX - w * 0.3, y + h * 0.1, w * 0.22, h * 0.18, -20, 0.8]] }) +
    `<path d="M${f(CX - w * 0.35)} ${f(y + h * 0.75)} q4 -6 9 0 M${f(CX + w * 0.12)} ${f(y + h * 0.75)} q4 -6 9 0" fill="none" stroke="${shade(skin, 0.5)}" stroke-width="4" stroke-linecap="round"/>`
  )
}

function mouth(expr, { y = HY + 128, w = 46, hidden = false } = {}) {
  if (expr === 'happy') {
    const d = `M${CX - w * 1.15} ${y - 8} Q${CX} ${y + 4} ${CX + w * 1.15} ${y - 8} Q${CX + w * 0.95} ${y + w * 1.25} ${CX} ${y + w * 1.3} Q${CX - w * 0.95} ${y + w * 1.25} ${CX - w * 1.15} ${y - 8}Z`
    const cid = newId('mo')
    return (
      `<clipPath id="${cid}"><path d="${d}"/></clipPath>` +
      `<path d="${d}" fill="#6E1A10"/>` +
      `<g clip-path="url(#${cid})"><rect x="${CX - w * 1.3}" y="${y - 20}" width="${w * 2.6}" height="${hidden ? 14 : 26}" rx="8" fill="#FFFFFF"/>` +
      `<ellipse cx="${CX + 6}" cy="${y + w * 1.15}" rx="${w * 0.7}" ry="${w * 0.45}" fill="#E8656A"/></g>` +
      `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`
    )
  }
  if (expr === 'angry') {
    const d = `M${CX - w * 0.95} ${y + 22} Q${CX} ${y - 22} ${CX + w * 0.95} ${y + 22} Q${CX + w * 0.6} ${y + 46} ${CX} ${y + 44} Q${CX - w * 0.6} ${y + 46} ${CX - w * 0.95} ${y + 22}Z`
    const cid = newId('mo')
    let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><path d="${d}" fill="#4A120B"/>`
    s += `<g clip-path="url(#${cid})"><rect x="${CX - w}" y="${y - 6}" width="${w * 2}" height="22" fill="#fff"/><rect x="${CX - w}" y="${y + 30}" width="${w * 2}" height="20" fill="#fff"/>`
    for (let i = -2; i <= 2; i++) s += `<path d="M${CX + i * w * 0.38} ${y - 10} V${y + 52}" stroke="#9AA3AD" stroke-width="3"/>`
    s += `</g><path d="${d}" fill="none" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/>`
    return s
  }
  return `<path d="M${CX - w * 0.9} ${y} Q${CX} ${y + 26} ${CX + w * 0.9} ${y}" fill="none" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/><path d="M${CX - w * 0.96} ${y - 6} q-6 6 0 12 M${CX + w * 0.96} ${y - 6} q6 6 0 12" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`
}

function cheeks(expr, { y = HY + 74, gap = 104, strength = 1 } = {}) {
  const op = (expr === 'happy' ? 0.55 : expr === 'angry' ? 0.25 : 0.35) * strength
  return [-1, 1].map((s) => `<ellipse cx="${CX + s * gap}" cy="${y}" rx="34" ry="20" fill="#F2727A" opacity="${op}" filter="url(#b6)"/>`).join('')
}

/** Kızgınlık: alnında kırmızılık ve öfke işareti. */
function anger(shape) {
  const d = headPath(shape)
  const cid = newId('an')
  const [ag, agd] = lg(
    [
      [0, '#E0302A', 0.55],
      [0.45, '#E0302A', 0.0],
    ],
    0,
    0,
    0,
    1,
  )
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath>${agd}<g clip-path="url(#${cid})"><rect x="0" y="0" width="${V}" height="${V}" fill="url(#${ag})"/></g>`
  const x = CX + 112
  const y = HY - 112
  s += `<g transform="translate(${x} ${y}) rotate(12)" stroke="${OUT}" stroke-width="13" stroke-linecap="round" fill="none"><path d="M-22 -8 Q-8 -8 -8 -22 M8 -22 Q8 -8 22 -8 M22 8 Q8 8 8 22 M-8 22 Q-8 8 -22 8"/></g>`
  s += `<g transform="translate(${x} ${y}) rotate(12)" stroke="#E8392F" stroke-width="7" stroke-linecap="round" fill="none"><path d="M-22 -8 Q-8 -8 -8 -22 M8 -22 Q8 -8 22 -8 M22 8 Q8 8 8 22 M-8 22 Q-8 8 -22 8"/></g>`
  return s
}

function glassesRound({ y = HY + 6, gap = 64, r = 46, color = '#3B2416', lens = '#BFE3F0' } = {}) {
  let s = ''
  for (const side of [-1, 1]) {
    const x = CX + side * gap
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${lens}" opacity=".22"/>`
    s += `<path d="M${x - r * 0.55} ${y - r * 0.35} L${x - r * 0.1} ${y - r * 0.75}" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>`
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${OUT}" stroke-width="12"/>`
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="6"/>`
  }
  s += `<path d="M${CX - gap + r} ${y - 4} Q${CX} ${y - 22} ${CX + gap - r} ${y - 4}" fill="none" stroke="${OUT}" stroke-width="9"/>`
  return s
}

function mustache(color, { y = HY + 100, w = 92, h = 34, curl = true } = {}) {
  const d = `M${CX} ${y - 6} C${CX + w * 0.35} ${y - h * 0.9} ${CX + w * 0.9} ${y - h * 0.6} ${CX + w} ${y + h * 0.25} C${CX + w * 1.05} ${y + h * (curl ? 0.85 : 0.5)} ${CX + w * 0.7} ${y + h * 0.75} ${CX + w * 0.45} ${y + h * 0.45} C${CX + w * 0.25} ${y + h * 0.3} ${CX + 10} ${y + h * 0.4} ${CX} ${y + h * 0.15} C${CX - 10} ${y + h * 0.4} ${CX - w * 0.25} ${y + h * 0.3} ${CX - w * 0.45} ${y + h * 0.45} C${CX - w * 0.7} ${y + h * 0.75} ${CX - w * 1.05} ${y + h * (curl ? 0.85 : 0.5)} ${CX - w} ${y + h * 0.25} C${CX - w * 0.9} ${y - h * 0.6} ${CX - w * 0.35} ${y - h * 0.9} ${CX} ${y - 6}Z`
  return toon(d, color, { sw: SW, band: [5, 6], light: 1.25, spec: [[CX - w * 0.5, y - h * 0.15, w * 0.18, h * 0.12, -15, 0.55]] })
}

// ---------- Tema aksesuarları ----------

function scarf(color, stripe) {
  const d = `M${CX - 150} 512 Q${CX} 580 ${CX + 150} 512 L${CX + 160} 560 Q${CX} 640 ${CX - 160} 560Z`
  const tail = `M${CX + 70} 570 L${CX + 120} 700 L${CX + 60} 712 L${CX + 30} 590Z`
  return (
    toon(tail, shade(color, 0.92), { sw: SW, band: [4, 4] }) +
    toon(d, color, {
      sw: SW,
      band: [0, 8],
      inner: `<path d="M${CX - 170} 545 Q${CX} 615 ${CX + 170} 545" stroke="${stripe}" stroke-width="14" fill="none"/>`,
    })
  )
}

function beanie(top, color, band) {
  const d = `M${CX - 158} ${top + 112} Q${CX - 160} ${top - 20} ${CX} ${top - 32} Q${CX + 160} ${top - 20} ${CX + 158} ${top + 112}Z`
  const b = `M${CX - 166} ${top + 84} Q${CX} ${top + 64} ${CX + 166} ${top + 84} L${CX + 162} ${top + 132} Q${CX} ${top + 112} ${CX - 162} ${top + 132}Z`
  return (
    toon(d, color, { sw: SW, band: [10, 6] }) +
    toon(b, band, { sw: SW, band: [0, 6], inner: [...Array(9)].map((_, i) => `<path d="M${CX - 150 + i * 38} ${top + 70} v70" stroke="${shade(band, 0.85)}" stroke-width="6"/>`).join('') }) +
    toon(ellipsePath(CX, top - 40, 34, 30), '#FFFFFF', { sw: SW, band: [4, 4] })
  )
}

function sunHat(top, color = '#E8C37A', ribbon = '#C0392B') {
  const brim = ellipsePath(CX, top + 104, 236, 52)
  const crown = `M${CX - 130} ${top + 104} Q${CX - 128} ${top - 16} ${CX} ${top - 22} Q${CX + 128} ${top - 16} ${CX + 130} ${top + 104}Z`
  return (
    toon(brim, color, { sw: SW, band: [0, 10] }) +
    toon(crown, color, { sw: SW, band: [10, 4], inner: `<rect x="${CX - 140}" y="${top + 62}" width="280" height="30" fill="${ribbon}"/>` })
  )
}

function sunglasses(y = HY + 4, gap = 64) {
  let s = ''
  for (const side of [-1, 1]) {
    const x = CX + side * gap
    const d = `M${x - 52} ${y - 30} L${x + 52} ${y - 30} Q${x + 54} ${y + 34} ${x} ${y + 36} Q${x - 54} ${y + 34} ${x - 52} ${y - 30}Z`
    s += toon(d, '#1F2A36', { sw: SW, band: [0, 0], light: 1.6, spec: [[x - 18, y - 6, 18, 8, -25, 0.6]] })
  }
  s += `<path d="M${CX - gap + 52} ${y - 22} Q${CX} ${y - 36} ${CX + gap - 52} ${y - 22}" fill="none" stroke="${OUT}" stroke-width="10"/>`
  return s
}

function witchHat(top, color = '#3A2459', band = '#F07C1E') {
  const brim = ellipsePath(CX, top + 96, 230, 46)
  const cone = `M${CX - 128} ${top + 96} Q${CX - 60} ${top - 40} ${CX + 40} ${top - 170} Q${CX + 80} ${top - 196} ${CX + 120} ${top - 160} Q${CX + 60} ${top - 120} ${CX + 70} ${top - 40} Q${CX + 100} ${top + 40} ${CX + 128} ${top + 96}Z`
  return toon(brim, color, { sw: SW, band: [0, 10] }) + toon(cone, color, { sw: SW, band: [12, 4], inner: `<rect x="${CX - 140}" y="${top + 48}" width="300" height="34" fill="${band}"/>` })
}

function catEars(top, color = '#2A1A12') {
  let s = ''
  for (const side of [-1, 1]) {
    const x = CX + side * 100
    const d = `M${x - 52} ${top + 60} L${x + side * 6} ${top - 60} L${x + 52} ${top + 60}Z`
    s += toon(d, color, { sw: SW, band: [6, 4], inner: `<path d="M${x - 26} ${top + 50} L${x + side * 4} ${top - 22} L${x + 26} ${top + 50}Z" fill="#F07CA0"/>` })
  }
  return s
}

function vampCollar(color = '#8B1E0F') {
  const d = `M${CX - 90} 520 L${CX - 250} 400 L${CX - 210} 560 Q${CX} 600 ${CX + 210} 560 L${CX + 250} 400 L${CX + 90} 520Z`
  return toon(d, '#1A1020', { sw: SW, band: [0, 6], inner: `<path d="M${CX - 236} 420 L${CX - 100} 524 L${CX + 100} 524 L${CX + 236} 420" fill="none" stroke="${color}" stroke-width="16"/>` })
}

function themeAccessory(theme, who, slot) {
  // slot: 'neck' (gövde üstü), 'head' (başın üstü), 'face' (yüz önü)
  if (theme === 'kis') {
    if (slot === 'neck') return scarf(who === 'ogrenci' ? '#E07A2F' : '#C0392B', '#FFFFFF')
    if (slot === 'head' && (who === 'ogrenci' || who === 'esnaf' || who === 'muhtar')) return beanie(104, who === 'muhtar' ? '#2F5D50' : '#3A6EA5', '#E7E2D6')
  }
  if (theme === 'yaz') {
    if (slot === 'head' && (who === 'esnaf' || who === 'muhtar')) return sunHat(112)
    if (slot === 'face' && (who === 'taksici' || who === 'ogrenci')) return ''
  }
  if (theme === 'halloween') {
    if (slot === 'head' && who === 'ogrenci') return witchHat(96)
    if (slot === 'head' && who === 'esnaf') return catEars(120)
    if (slot === 'neck' && who === 'muhtar') return vampCollar()
  }
  return ''
}

// ---------- Karakterler ----------

function riza(theme, expr) {
  const skin = '#EDB88E'
  const shape = { w: 148, top: 132, chin: 468, jaw: 0.74 }
  let s = contactShadow(CX, 760, 300, 30, 0.2)
  // Gövde: beyaz gömlek + kahverengi örgü yelek
  s += toon(torsoPath(512, 1), '#F4F1EA', { sw: SW, band: [12, 0] })
  const vest = `M${CX - 300} ${V + 20} L${CX - 280} 640 Q${CX - 250} 556 ${CX - 160} 538 L${CX - 40} 690 L${CX - 30} ${V + 20}Z M${CX + 300} ${V + 20} L${CX + 280} 640 Q${CX + 250} 556 ${CX + 160} 538 L${CX + 40} 690 L${CX + 30} ${V + 20}Z`
  s += toon(vest, '#8A5A3B', {
    sw: SW,
    band: [10, 0],
    inner: [...Array(14)].map((_, i) => `<path d="M${CX - 300 + i * 46} 540 l-14 230" stroke="#7A4C30" stroke-width="5" opacity=".6"/>`).join(''),
  })
  for (const by of [600, 660, 720]) s += toon(ellipsePath(CX + 52, by, 10, 10), '#E2B33C', { sw: 4, band: [2, 2], rim: false })
  // Yaka
  s += toon(`M${CX - 66} 520 L${CX - 118} 590 L${CX - 20} 610 Z`, '#FFFFFF', { sw: SW, band: [0, 4], rim: false })
  s += toon(`M${CX + 66} 520 L${CX + 118} 590 L${CX + 20} 610 Z`, '#FFFFFF', { sw: SW, band: [0, 4], rim: false })
  s += themeAccessory(theme, 'riza', 'neck')
  s += neck(skin, 60, 430, 548)
  s += HEAD
  s += ears(skin)
  s += face(skin, shape)
  // Kırışıklıklar
  s += `<path d="M${CX - 128} ${HY + 18} q-10 8 -4 18 M${CX + 128} ${HY + 18} q10 8 4 18" fill="none" stroke="${shade(skin, 0.65)}" stroke-width="4" stroke-linecap="round"/>`
  // Yanlarda beyaz saçlar
  for (const side of [-1, 1]) {
    const hx = CX + side * 140
    const d = smoothPath([
      [hx - side * 10, HY - 110],
      [hx + side * 32, HY - 70],
      [hx + side * 30, HY - 10],
      [hx + side * 6, HY + 10],
      [hx - side * 16, HY - 30],
    ])
    s += toon(d, '#F2F2EE', { sw: SW, band: [side * -4, 5], light: 1.05 })
  }
  s += cheeks(expr)
  s += eyes(expr, { skin, iris: '#5B3A22' })
  s += glassesRound({ color: '#B08A2E' })
  s += brows(expr, { y: HY - 62, color: '#F4F4F0', bushy: true, thick: 15 })
  s += nose(skin, { w: 34, h: 28 })
  s += mouth(expr, { y: HY + 136, w: 40, hidden: true })
  s += mustache('#F2F2EE', { y: HY + 104, w: 98, h: 40 })
  if (expr === 'angry') s += anger(shape)
  // Kasket
  if (!themeAccessory(theme, 'riza', 'head')) {
    const cap = `M${CX - 170} ${HY - 62} Q${CX - 176} ${HY - 196} ${CX - 20} ${HY - 206} Q${CX + 150} ${HY - 210} ${CX + 172} ${HY - 92} Q${CX + 170} ${HY - 66} ${CX + 150} ${HY - 60} Q${CX} ${HY - 92} ${CX - 170} ${HY - 62}Z`
    const brim = `M${CX - 176} ${HY - 70} Q${CX} ${HY - 104} ${CX + 160} ${HY - 74} Q${CX + 120} ${HY - 34} ${CX} ${HY - 40} Q${CX - 130} ${HY - 34} ${CX - 176} ${HY - 70}Z`
    const tweed = [...Array(16)]
      .map((_, i) => `<path d="M${CX - 180 + i * 24} ${HY - 220} l40 170" stroke="#5E5446" stroke-width="3" opacity=".35"/>`)
      .join('')
    s += toon(cap, '#7D7266', { sw: SW + 1, band: [12, 8], inner: tweed, spec: [[CX - 70, HY - 170, 40, 12, -12, 0.35]] })
    s += toon(brim, '#6A6056', { sw: SW + 1, band: [0, 8] })
    s += toon(ellipsePath(CX - 6, HY - 204, 14, 8), '#6A6056', { sw: 5, band: [2, 2], rim: false })
  }
  return s
}

function muhtar(theme, expr) {
  const skin = '#E2A574'
  const shape = { w: 156, top: 126, chin: 476, jaw: 0.86, cheek: 1.03 }
  let s = contactShadow(CX, 760, 320, 30, 0.2)
  // Takım elbise
  s += toon(torsoPath(512, 1.08), '#24395E', { sw: SW, band: [14, 0] })
  s += toon(`M${CX - 70} 520 L${CX} 650 L${CX + 70} 520Z`, '#FFFFFF', { sw: SW, band: [0, 0], rim: false })
  s += toon(`M${CX - 26} 560 L${CX + 26} 560 L${CX + 36} 720 L${CX} 760 L${CX - 36} 720Z`, '#B3261E', {
    sw: SW,
    band: [4, 0],
    inner: [...Array(8)].map((_, i) => `<path d="M${CX - 50} ${560 + i * 26} l100 -30" stroke="#8C1A14" stroke-width="6"/>`).join(''),
  })
  s += toon(`M${CX - 30} 530 L${CX + 30} 530 L${CX + 22} 566 L${CX - 22} 566Z`, '#B3261E', { sw: SW, band: [2, 2], rim: false })
  // Yaka (ceket)
  s += toon(`M${CX - 80} 516 L${CX - 200} 560 L${CX - 120} 640 L${CX - 150} 670 L${CX - 30} 768 L${CX - 20} 700Z`, '#2C4672', { sw: SW, band: [6, 0] })
  s += toon(`M${CX + 80} 516 L${CX + 200} 560 L${CX + 120} 640 L${CX + 150} 670 L${CX + 30} 768 L${CX + 20} 700Z`, '#2C4672', { sw: SW, band: [6, 0] })
  // Muhtar rozeti
  s += toon(ellipsePath(CX - 190, 640, 22, 22), '#E2B33C', { sw: 5, band: [3, 3], spec: [[CX - 197, 632, 7, 5, 0, 0.8]] })
  s += themeAccessory(theme, 'muhtar', 'neck')
  s += neck(skin, 70, 436, 548)
  s += HEAD
  s += ears(skin, HY + 24, 156)
  s += face(skin, shape)
  // Gıdı
  s += `<path d="M${CX - 70} 470 Q${CX} 500 ${CX + 70} 470" fill="none" stroke="${shade(skin, 0.68)}" stroke-width="5" stroke-linecap="round"/>`
  // Kel tepe parlaması + yanlarda koyu saç
  s += `<ellipse cx="${CX - 50}" cy="${HY - 140}" rx="50" ry="18" transform="rotate(-14 ${CX - 50} ${HY - 140})" fill="#fff" opacity=".6"/>`
  for (const side of [-1, 1]) {
    const hx = CX + side * 150
    const d = smoothPath([
      [hx - side * 14, HY - 96],
      [hx + side * 10, HY - 104],
      [hx + side * 26, HY - 70],
      [hx + side * 30, HY - 20],
      [hx + side * 22, HY + 20],
      [hx + side * 4, HY + 6],
      [hx - side * 2, HY - 30],
      [hx - side * 14, HY - 60],
    ])
    s += toon(d, '#3A302B', { sw: SW, band: [side * -4, 5], light: 1.5, inner: `<path d="M${hx} ${HY - 80} q${side * 14} 40 ${side * 8} 80" stroke="#9A918A" stroke-width="5" fill="none" opacity=".7"/>` })
  }
  s += cheeks(expr, { strength: 0.8 })
  s += eyes(expr, { skin, iris: '#3B2414', gap: 66 })
  s += brows(expr, { y: HY - 60, color: '#241A16', bushy: true, thick: 14, gap: 66 })
  s += nose(skin, { w: 38, h: 30 })
  s += mouth(expr, { y: HY + 142, w: 42, hidden: true })
  s += mustache('#241A16', { y: HY + 110, w: 104, h: 44, curl: false })
  if (expr === 'angry') s += anger(shape)
  s += themeAccessory(theme, 'muhtar', 'head')
  return s
}

function taksici(theme, expr) {
  const skin = '#C98A5A'
  const shape = { w: 146, top: 136, chin: 470, jaw: 0.8 }
  let s = contactShadow(CX, 760, 300, 30, 0.2)
  // Sarı tişört + kahverengi deri ceket
  s += toon(torsoPath(512, 1.02), '#F2C230', { sw: SW, band: [12, 0] })
  s += toon(`M${CX - 290} ${V + 20} L${CX - 280} 630 Q${CX - 250} 552 ${CX - 120} 528 L${CX - 70} 600 L${CX - 90} ${V + 20}Z`, '#6E3F22', {
    sw: SW,
    band: [8, 0],
    spec: [[CX - 220, 600, 26, 10, -40, 0.5]],
  })
  s += toon(`M${CX + 290} ${V + 20} L${CX + 280} 630 Q${CX + 250} 552 ${CX + 120} 528 L${CX + 70} 600 L${CX + 90} ${V + 20}Z`, '#6E3F22', {
    sw: SW,
    band: [8, 0],
  })
  s += toon(`M${CX - 120} 524 L${CX - 190} 560 L${CX - 110} 640 L${CX - 70} 590Z`, '#5A321A', { sw: SW, band: [0, 4] })
  s += toon(`M${CX + 120} 524 L${CX + 190} 560 L${CX + 110} 640 L${CX + 70} 590Z`, '#5A321A', { sw: SW, band: [0, 4] })
  // Taksi damalı rozet
  s += `<g transform="translate(${CX + 30} 640)"><rect x="-26" y="-14" width="52" height="28" rx="6" fill="#fff" stroke="${OUT}" stroke-width="5"/>${[0, 1, 2, 3]
    .map((i) => `<rect x="${-22 + i * 12}" y="${i % 2 ? -10 : 0}" width="12" height="10" fill="#1F2A36"/>`)
    .join('')}</g>`
  s += themeAccessory(theme, 'taksici', 'neck')
  s += neck(skin, 62, 430, 548)
  s += HEAD
  s += ears(skin)
  s += face(skin, shape)
  // Sakal gölgesi
  const jaw = `M${CX - 140} ${HY + 40} Q${CX - 130} ${HY + 160} ${CX} ${HY + 172} Q${CX + 130} ${HY + 160} ${CX + 140} ${HY + 40} Q${CX + 100} ${HY + 120} ${CX} ${HY + 120} Q${CX - 100} ${HY + 120} ${CX - 140} ${HY + 40}Z`
  s += `<path d="${jaw}" fill="#4A3A34" opacity=".22"/>`
  // Saç: arkaya taranmış, kabarık
  const hair = smoothPath([
    [CX - 156, HY - 10],
    [CX - 168, HY - 120],
    [CX - 110, HY - 196],
    [CX + 10, HY - 214],
    [CX + 130, HY - 190],
    [CX + 166, HY - 110],
    [CX + 156, HY - 10],
    [CX + 132, HY - 70],
    [CX + 60, HY - 112],
    [CX - 40, HY - 118],
    [CX - 120, HY - 84],
  ])
  s += toon(hair, '#1E1814', { sw: SW + 1, band: [10, 6], light: 1.6, spec: [[CX - 40, HY - 176, 60, 12, -8, 0.4]] })
  // Başa itilmiş güneş gözlüğü
  if (theme !== 'yaz') {
    for (const side of [-1, 1]) {
      const x = CX + side * 62
      s += toon(`M${x - 50} ${HY - 152} L${x + 50} ${HY - 152} Q${x + 50} ${HY - 108} ${x} ${HY - 106} Q${x - 50} ${HY - 108} ${x - 50} ${HY - 152}Z`, '#2A3A48', {
        sw: SW,
        band: [0, 0],
        light: 1.7,
        spec: [[x - 18, HY - 136, 16, 6, -20, 0.6]],
      })
    }
  }
  s += cheeks(expr, { strength: 0.6 })
  s += eyes(expr, { skin, iris: '#2E1C10' })
  s += brows(expr, { color: '#1E1814', thick: 16 })
  s += nose(skin, { w: 32, h: 28 })
  s += mouth(expr, { w: 48 })
  if (expr === 'neutral') s += `<path d="M${CX + 36} ${HY + 132} L${CX + 110} ${HY + 116}" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/><path d="M${CX + 36} ${HY + 132} L${CX + 110} ${HY + 116}" stroke="#E8C88A" stroke-width="5" stroke-linecap="round"/>`
  if (theme === 'yaz') s += sunglasses()
  if (expr === 'angry') s += anger(shape)
  return s
}

function ogrenci(theme, expr) {
  const skin = '#F4C9A4'
  const shape = { w: 140, top: 140, chin: 458, jaw: 0.7 }
  const hairC = '#7A3E1E'
  let s = contactShadow(CX, 760, 290, 30, 0.2)
  // Arka saç (omuza dökülen)
  const backHair = smoothPath([
    [CX - 170, HY - 60],
    [CX - 196, HY + 120],
    [CX - 176, HY + 250],
    [CX - 90, HY + 230],
    [CX + 90, HY + 230],
    [CX + 176, HY + 250],
    [CX + 196, HY + 120],
    [CX + 170, HY - 60],
  ])
  s += toon(backHair, shade(hairC, 0.85), { sw: SW, band: [8, 0] })
  // Turkuaz kapüşonlu
  s += toon(torsoPath(518, 0.98), '#1E9AA8', { sw: SW, band: [12, 0] })
  s += toon(`M${CX - 150} 512 Q${CX} 600 ${CX + 150} 512 Q${CX + 120} 470 ${CX} 470 Q${CX - 120} 470 ${CX - 150} 512Z`, '#178391', { sw: SW, band: [0, 6] })
  for (const side of [-1, 1]) s += `<path d="M${CX + side * 40} 560 q${side * 6} 60 ${side * -4} 110" stroke="${OUT}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${CX + side * 40} 560 q${side * 6} 60 ${side * -4} 110" stroke="#F3E6C8" stroke-width="5" fill="none" stroke-linecap="round"/>`
  // Boyundaki kulaklık
  s += `<path d="M${CX - 120} 516 Q${CX} 586 ${CX + 120} 516" fill="none" stroke="${OUT}" stroke-width="18"/><path d="M${CX - 120} 516 Q${CX} 586 ${CX + 120} 516" fill="none" stroke="#33404D" stroke-width="9"/>`
  for (const side of [-1, 1]) s += toon(ellipsePath(CX + side * 124, 520, 28, 34), '#33404D', { sw: SW, band: [4, 4], light: 1.5, inner: `<ellipse cx="${CX + side * 124}" cy="520" rx="16" ry="21" fill="#F2735B"/>` })
  s += themeAccessory(theme, 'ogrenci', 'neck')
  s += neck(skin, 56, 424, 520)
  s += HEAD
  s += ears(skin, HY + 22, 138, 0.92)
  s += face(skin, shape)
  // Çiller
  for (const [dx, dy] of [
    [-96, 54],
    [-80, 64],
    [-110, 68],
    [96, 54],
    [80, 64],
    [110, 68],
  ])
    s += `<circle cx="${CX + dx}" cy="${HY + dy}" r="4" fill="#C77A4E" opacity=".7"/>`
  // Ön saç (perçem) + topuz
  const bun = ellipsePath(CX + 10, HY - 214, 70, 58)
  s += toon(bun, hairC, { sw: SW + 1, band: [8, 6], light: 1.3, spec: [[CX - 20, HY - 236, 22, 10, -20, 0.4]] })
  const fringe = smoothPath([
    [CX - 160, HY + 30],
    [CX - 172, HY - 80],
    [CX - 110, HY - 168],
    [CX, HY - 186],
    [CX + 112, HY - 168],
    [CX + 170, HY - 80],
    [CX + 158, HY + 30],
    [CX + 132, HY - 40],
    [CX + 70, HY - 92],
    [CX + 20, HY - 70],
    [CX - 40, HY - 112],
    [CX - 120, HY - 64],
  ])
  s += toon(fringe, hairC, { sw: SW + 1, band: [10, 6], light: 1.3, spec: [[CX - 70, HY - 140, 50, 12, -25, 0.4]] })
  s += cheeks(expr, { strength: 1.1 })
  s += eyes(expr, { skin, iris: '#2E6B3A', gap: 62, rx: 34, ry: 42 })
  // Kirpik
  if (expr !== 'happy') for (const side of [-1, 1]) s += `<path d="M${CX + side * 98} ${HY - 22} l${side * 16} -10" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>`
  s += glassesRound({ gap: 62, r: 50, color: '#1F4E8C' })
  s += brows(expr, { y: HY - 64, color: hairC, thick: 11, gap: 62, w: 40 })
  s += nose(skin, { w: 24, h: 20, y: HY + 66 })
  s += mouth(expr, { w: 40, y: HY + 122 })
  if (expr === 'angry') s += anger(shape)
  s += themeAccessory(theme, 'ogrenci', 'head')
  return s
}

function esnaf(theme, expr) {
  const skin = '#E6B089'
  const shape = { w: 144, top: 138, chin: 462, jaw: 0.74 }
  const hairC = '#3A2418'
  let s = contactShadow(CX, 760, 300, 30, 0.2)
  // Hardal gömlek + çizgili önlük
  s += toon(torsoPath(516, 1), '#D9A43A', { sw: SW, band: [12, 0] })
  const apron = `M${CX - 170} 600 L${CX + 170} 600 L${CX + 190} ${V + 20} L${CX - 190} ${V + 20}Z`
  s += toon(apron, '#FFFFFF', {
    sw: SW,
    band: [8, 0],
    inner: [...Array(10)].map((_, i) => `<rect x="${CX - 200 + i * 42}" y="590" width="18" height="200" fill="#2F6DB5"/>`).join(''),
  })
  for (const side of [-1, 1]) s += `<path d="M${CX + side * 150} 604 L${CX + side * 100} 520" stroke="${OUT}" stroke-width="18" stroke-linecap="round"/><path d="M${CX + side * 150} 604 L${CX + side * 100} 520" stroke="#2F6DB5" stroke-width="9" stroke-linecap="round"/>`
  s += toon(`M${CX - 60} 516 L${CX} 568 L${CX + 60} 516 Q${CX} 540 ${CX - 60} 516Z`, shade(skin, 0.92), { sw: 5, band: [0, 0], rim: false })
  s += themeAccessory(theme, 'esnaf', 'neck')
  s += neck(skin, 58, 426, 520)
  s += HEAD
  // Arka topuz
  s += toon(ellipsePath(CX + 120, HY + 120, 56, 52), hairC, { sw: SW, band: [6, 6], light: 1.4 })
  s += ears(skin, HY + 22, 144, 0.95)
  // Altın halka küpeler
  for (const side of [-1, 1]) s += `<circle cx="${CX + side * 162}" cy="${HY + 74}" r="18" fill="none" stroke="${OUT}" stroke-width="11"/><circle cx="${CX + side * 162}" cy="${HY + 74}" r="18" fill="none" stroke="#E2B33C" stroke-width="5"/>`
  s += face(skin, shape)
  // Yandan ayrık saç
  const hair = smoothPath([
    [CX - 156, HY + 40],
    [CX - 170, HY - 90],
    [CX - 90, HY - 186],
    [CX + 40, HY - 196],
    [CX + 150, HY - 140],
    [CX + 166, HY - 20],
    [CX + 150, HY + 60],
    [CX + 130, HY - 60],
    [CX + 40, HY - 120],
    [CX - 70, HY - 110],
    [CX - 130, HY - 40],
  ])
  s += toon(hair, hairC, { sw: SW + 1, band: [10, 6], light: 1.5, spec: [[CX + 30, HY - 166, 56, 12, 10, 0.4]] })
  // Kulak arkasında kalem
  s += `<g transform="rotate(-62 ${CX + 168} ${HY - 20})"><rect x="${CX + 110}" y="${HY - 32}" width="130" height="22" rx="4" fill="#F2C230" stroke="${OUT}" stroke-width="6"/><path d="M${CX + 240} ${HY - 32} l26 11 l-26 11Z" fill="#F3D9B0" stroke="${OUT}" stroke-width="6" stroke-linejoin="round"/><rect x="${CX + 102}" y="${HY - 32}" width="18" height="22" fill="#F28B82" stroke="${OUT}" stroke-width="6"/></g>`
  s += cheeks(expr, { strength: 1 })
  s += eyes(expr, { skin, iris: '#4A2A16' })
  if (expr !== 'happy') for (const side of [-1, 1]) s += `<path d="M${CX + side * 100} ${HY - 22} l${side * 16} -10 M${CX + side * 92} ${HY - 32} l${side * 10} -14" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>`
  s += brows(expr, { color: hairC, thick: 11, w: 40 })
  s += nose(skin, { w: 26, h: 22 })
  s += mouth(expr, { w: 42 })
  if (expr === 'angry') s += anger(shape)
  s += themeAccessory(theme, 'esnaf', 'head')
  return s
}

const BUILDERS = { riza, muhtar, taksici, ogrenci, esnaf }

register(
  (id) => id.startsWith('char_'),
  (a, ctx) => {
    const [, who, expr] = a.id.split('_')
    const [body, head = ''] = BUILDERS[who](ctx.theme, expr).split(HEAD)
    // Büyük kafa: baş çene hizasından ölçeklenip hafif aşağı iner (boyun kısalır).
    return svgV(a.w, a.h, `${body}<g transform="translate(0 16) translate(${CX} 470) scale(1.08) translate(${-CX} -470)">${head}</g>`)
  },
)

export { mix }
