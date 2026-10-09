// Müşteriler: büst çekimi, omuzdan yukarısı, hafif 3/4 açı, kameraya bakıyor.
// Her müşteri 3 ifade (neutral, happy, angry) × 4 tema. Aynı yüz, aynı ifade; temada kıyafet/aksesuar değişir.

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, mix, newId, shade, silhouette, smoothPath, starPath, svg } from '../lib/svg.mjs'

const W = 512
const FX = 10 // 3/4 açı: yüz özellikleri sola kayık

// ---------- Ortak parçalar ----------

function headPath(cx, cy, rx, ry, jaw = 0.82, cheek = 1.0) {
  const pts = []
  const n = 28
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    const s = Math.sin(a)
    const k = s > 0 ? 1 - (1 - jaw) * s * s : 1 + (cheek - 1) * Math.cos(a) * Math.cos(a)
    // 3/4: sağ yanak (izleyicinin sağı) biraz daha dolgun
    const side = Math.cos(a) > 0 ? 1.03 : 0.97
    pts.push([cx + rx * Math.cos(a) * k * side, cy + ry * s])
  }
  return smoothPath(pts)
}

function torsoPath(top = 352, wide = 1) {
  const l = 256 - 186 * wide
  const r = 256 + 186 * wide
  return `M${f(l)} 482 C${f(l - 6)} 432 ${f(l + 22)} 398 ${f(l + 78)} 378 C${f(l + 110)} 366 200 ${top + 6} 214 ${top} L298 ${top} C312 ${top + 6} ${f(r - 110)} 366 ${f(r - 78)} 378 C${f(r - 22)} 398 ${f(r + 6)} 432 ${f(r)} 482 Q256 510 ${f(l)} 482Z`
}

function neckPath(cy, w = 40, top = 290, bottom = 368) {
  return `M${256 - w} ${top} L${256 - w - 2} ${bottom - 12} Q256 ${bottom + 10} ${256 + w + 2} ${bottom - 12} L${256 + w} ${top} Z`
}

function ear(cx, cy, skin, side = 1, scale = 1) {
  const x = cx
  const d = smoothPath([
    [x - 6 * side, cy - 26 * scale],
    [x + 16 * side, cy - 22 * scale],
    [x + 22 * side, cy],
    [x + 14 * side, cy + 24 * scale],
    [x - 6 * side, cy + 22 * scale],
  ])
  return (
    cel(d, skin, { sw: 6, off: [-4 * side, 4], shadow: 0.82 }) +
    line(`M${x + 2 * side} ${cy - 12 * scale} Q${x + 14 * side} ${cy} ${x + 4 * side} ${cy + 12 * scale}`, 4, shade(skin, 0.6))
  )
}

function eyes(expr, cx, cy, opt = {}) {
  const { gap = 40, size = 1, color = '#2B1A10', patch = false, lids = false } = opt
  const ex = [cx - gap + 2, cx + gap + 2]
  let s = ''
  ex.forEach((x, i) => {
    const far = i === 0 ? 0.9 : 1
    const rx = 15 * size * far
    const ry = 18 * size
    if (patch && i === 0) return
    if (expr === 'happy') {
      s += line(`M${f(x - rx)} ${cy + 4} Q${x} ${cy - 16 * size} ${f(x + rx)} ${cy + 4}`, 7, C.out)
      return
    }
    if (expr === 'angry') {
      s += `<path d="${ellipsePath(x, cy + 3, rx, ry * 0.78)}" fill="#fff" stroke="${C.out}" stroke-width="5"/>`
      s += `<circle cx="${x + 1}" cy="${cy + 6}" r="${7 * size}" fill="${color}"/>`
      // Çatık göz kapağı
      const inner = i === 0 ? 1 : -1
      s += `<path d="M${f(x - rx - 3)} ${f(cy - ry * 0.55 + (inner > 0 ? -6 : 6))} L${f(x + rx + 3)} ${f(cy - ry * 0.55 + (inner > 0 ? 6 : -6))} L${f(x + rx + 4)} ${f(cy - ry - 8)} L${f(x - rx - 4)} ${f(cy - ry - 8)}Z" fill="var(--skin)" />`
      s += line(`M${f(x - rx - 3)} ${f(cy - ry * 0.55 + (inner > 0 ? -6 : 6))} L${f(x + rx + 3)} ${f(cy - ry * 0.55 + (inner > 0 ? 6 : -6))}`, 5)
      return
    }
    s += `<path d="${ellipsePath(x, cy, rx, ry)}" fill="#fff" stroke="${C.out}" stroke-width="5"/>`
    s += `<circle cx="${x + 1}" cy="${cy + 3}" r="${8.5 * size}" fill="${color}"/>`
    s += `<circle cx="${x - 2}" cy="${cy - 1}" r="${3 * size}" fill="#fff"/>`
    if (lids) s += line(`M${f(x - rx - 2)} ${cy - 4} Q${x} ${cy - ry - 2} ${f(x + rx + 2)} ${cy - 4}`, 6)
  })
  return s
}

function brows(expr, cx, cy, opt = {}) {
  const { gap = 40, color = '#3B2416', w = 9, bushy = false } = opt
  const lx = cx - gap + 2
  const rxx = cx + gap + 2
  const y = cy - 30
  if (bushy) {
    const tilt = expr === 'angry' ? 12 : expr === 'happy' ? -6 : 0
    const brow = (x, s) =>
      `<path d="${smoothPath([
        [x - 26, y + 6 + (s > 0 ? -tilt : tilt) * 0.2],
        [x - 10, y - 8 + (s > 0 ? -tilt : tilt) * 0.5],
        [x + 14, y - 8 + (s < 0 ? -tilt : tilt) * 0.5],
        [x + 28, y + 4 + (s < 0 ? -tilt : tilt) * 0.8],
        [x + 8, y + 6],
        [x - 14, y + 8],
      ])}" fill="${color}" stroke="${C.out}" stroke-width="4"/>`
    return brow(lx, 1) + brow(rxx, -1)
  }
  if (expr === 'angry') {
    return line(`M${lx - 22} ${y - 6} L${lx + 18} ${y + 8}`, w, color) + line(`M${rxx + 22} ${y - 6} L${rxx - 18} ${y + 8}`, w, color)
  }
  if (expr === 'happy') {
    return line(`M${lx - 20} ${y + 2} Q${lx} ${y - 16} ${lx + 18} ${y - 2}`, w, color) + line(`M${rxx - 18} ${y - 2} Q${rxx} ${y - 16} ${rxx + 20} ${y + 2}`, w, color)
  }
  return line(`M${lx - 20} ${y} Q${lx} ${y - 10} ${lx + 18} ${y - 2}`, w, color) + line(`M${rxx - 18} ${y - 2} Q${rxx} ${y - 10} ${rxx + 20} ${y}`, w, color)
}

function nose(cx, cy, skin, size = 1) {
  const x = cx - 4
  const d = smoothPath([
    [x - 6, cy - 34 * size],
    [x + 8, cy - 10 * size],
    [x + 20 * size, cy + 6 * size],
    [x + 8, cy + 18 * size],
    [x - 16 * size, cy + 16 * size],
    [x - 22 * size, cy + 4 * size],
    [x - 12, cy - 8 * size],
  ])
  return cel(d, shade(skin, 0.97), { sw: 5, off: [-6, -5], shadow: 0.82, hl: [x - 8, cy - 2, 7 * size, 5 * size], hlOpacity: 0.55 }) +
    line(`M${f(x - 10 * size)} ${f(cy + 10 * size)} q4 4 9 1`, 3.5, shade(skin, 0.55))
}

function mouth(expr, cx, cy, opt = {}) {
  const { w = 1, fangs = false } = opt
  const x = cx
  if (expr === 'happy') {
    const d = `M${f(x - 34 * w)} ${cy - 4} Q${x} ${cy + 4} ${f(x + 34 * w)} ${cy - 6} Q${f(x + 26 * w)} ${cy + 34} ${x} ${cy + 36} Q${f(x - 26 * w)} ${cy + 34} ${f(x - 34 * w)} ${cy - 4}Z`
    const tid = newId('m')
    return `<clipPath id="${tid}"><path d="${d}"/></clipPath><path d="${d}" fill="#7A1F1A"/>
      <g clip-path="url(#${tid})"><rect x="${x - 40}" y="${cy - 12}" width="80" height="13" fill="#fff"/>
      <ellipse cx="${x + 2}" cy="${cy + 34}" rx="${18 * w}" ry="12" fill="#E86F64"/></g>
      <path d="${d}" fill="none" stroke="${C.out}" stroke-width="5" stroke-linejoin="round"/>
      ${fangs ? fangsSvg(x, cy - 2) : ''}`
  }
  if (expr === 'angry') {
    const d = `M${f(x - 26 * w)} ${cy + 12} Q${x} ${cy - 8} ${f(x + 26 * w)} ${cy + 12} Q${x} ${cy + 4} ${f(x - 26 * w)} ${cy + 12}Z`
    return `<path d="${d}" fill="#7A1F1A" stroke="${C.out}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M${f(x - 18 * w)} ${cy + 6} Q${x} ${cy - 3} ${f(x + 18 * w)} ${cy + 6}" fill="none" stroke="#fff" stroke-width="4"/>
      ${fangs ? fangsSvg(x, cy + 2, 0.8) : ''}`
  }
  return line(`M${f(x - 22 * w)} ${cy + 2} Q${x + 2} ${cy + 12} ${f(x + 24 * w)} ${cy - 2}`, 6) + (fangs ? fangsSvg(x, cy + 4, 0.8) : '')
}

function fangsSvg(x, y, s = 1) {
  return `<path d="M${f(x - 18 * s)} ${y} l6 ${f(16 * s)} l6 ${f(-16 * s)}Z M${f(x + 6 * s)} ${y} l6 ${f(16 * s)} l6 ${f(-16 * s)}Z" fill="#fff" stroke="${C.out}" stroke-width="3" stroke-linejoin="round"/>`
}

function cheeks(expr, cx, cy, opt = {}) {
  const { always = false, cold = false } = opt
  let s = ''
  const pos = [
    [cx - 66, cy + 26],
    [cx + 66, cy + 26],
  ]
  if (expr === 'happy' || always || cold) {
    for (const [x, y] of pos) s += `<ellipse cx="${x}" cy="${y}" rx="22" ry="13" fill="${C.pink}" opacity="${cold ? 0.75 : 0.55}" filter="url(#b4)"/>`
  }
  if (expr === 'angry') {
    for (const [x, y] of pos) s += `<ellipse cx="${x}" cy="${y}" rx="26" ry="15" fill="#E0412F" opacity="0.62" filter="url(#b4)"/>`
  }
  return s
}

/** Kızgınlıkta alında sevimli öfke işareti. */
function angerMark(x, y) {
  return `<g transform="translate(${x} ${y}) rotate(12)" stroke="#D32F2F" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="M-16 -4 Q-6 -6 -4 -16 M4 -16 Q6 -6 16 -4 M16 4 Q6 6 4 16 M-4 16 Q-6 6 -16 4"/></g>`
}

function sweat(x, y) {
  return `<path d="M${x} ${y} q-9 14 0 18 q9 -4 0 -18Z" fill="#9AD8F0" stroke="${C.out}" stroke-width="3"/>`
}

function snowOnShoulders() {
  const flakes = [
    [118, 400, 9],
    [150, 384, 6],
    [372, 386, 8],
    [404, 404, 6],
    [190, 372, 5],
    [338, 374, 5],
  ]
  return flakes
    .map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.45, 6)}" fill="#fff" stroke="${C.out}" stroke-width="2.5" stroke-linejoin="round"/>`)
    .join('')
}

function scarf(color, stripe, y = 352) {
  const band = `M140 ${y + 24} C170 ${y - 10} 342 ${y - 10} 372 ${y + 24} C380 ${y + 44} 360 ${y + 58} 330 ${y + 50} C300 ${y + 40} 212 ${y + 40} 182 ${y + 50} C152 ${y + 58} 132 ${y + 44} 140 ${y + 24}Z`
  const tail = `M300 ${y + 40} L338 ${y + 40} L350 ${y + 142} L312 ${y + 146}Z`
  const stripes = stripe
    ? `<path d="M304 ${y + 70} L342 ${y + 68} M307 ${y + 98} L346 ${y + 96} M309 ${y + 124} L349 ${y + 122}" stroke="${stripe}" stroke-width="10"/>`
    : ''
  return cel(tail, shade(color, 0.92), { sw: 6, inner: stripes }) + cel(band, color, { sw: 6, hl: [220, y + 10, 60, 10], inner: stripe ? `<path d="M150 ${y + 30} C190 ${y + 4} 322 ${y + 4} 362 ${y + 30}" stroke="${stripe}" stroke-width="9" fill="none"/>` : '' })
}

function beanie(cx, top, color, band, pompom = null, rx = 108) {
  const d = `M${cx - rx} ${top + 96} C${cx - rx} ${top + 10} ${cx - 40} ${top - 18} ${cx} ${top - 18} C${cx + 40} ${top - 18} ${cx + rx} ${top + 10} ${cx + rx} ${top + 96}Z`
  const b = `M${cx - rx - 8} ${top + 78} Q${cx} ${top + 60} ${cx + rx + 8} ${top + 78} L${cx + rx + 6} ${top + 112} Q${cx} ${top + 96} ${cx - rx - 6} ${top + 112}Z`
  const ribs = Array.from({ length: 9 }, (_, i) => {
    const x = cx - rx + 14 + i * ((rx * 2 - 28) / 8)
    return `M${f(x)} ${top + 84} L${f(x)} ${top + 108}`
  }).join(' ')
  return (
    (pompom ? cel(ellipsePath(cx, top - 26, 26, 24), pompom, { sw: 6, hl: [cx - 8, top - 34, 9, 7] }) : '') +
    cel(d, color, { sw: 7, hl: [cx - 36, top + 22, 34, 18] }) +
    cel(b, band, { sw: 6, inner: `<path d="${ribs}" stroke="${shade(band, 0.75)}" stroke-width="4"/>` })
  )
}

function strawHat(cx, top, band = C.tea, rx = 170) {
  const brim = ellipsePath(cx, top + 92, rx, 40)
  const crown = `M${cx - 92} ${top + 92} C${cx - 96} ${top + 20} ${cx - 60} ${top - 6} ${cx} ${top - 6} C${cx + 60} ${top - 6} ${cx + 96} ${top + 20} ${cx + 92} ${top + 92}Z`
  const weave = Array.from({ length: 7 }, (_, i) => `M${cx - 90} ${top + 14 + i * 12} Q${cx} ${top + 4 + i * 12} ${cx + 90} ${top + 14 + i * 12}`).join(' ')
  const brimWeave = `M${cx - rx + 20} ${top + 92} Q${cx} ${top + 128} ${cx + rx - 20} ${top + 92} M${cx - rx + 50} ${top + 88} Q${cx} ${top + 116} ${cx + rx - 50} ${top + 88}`
  return (
    cel(brim, '#E9C77B', { sw: 7, hl: [cx - 70, top + 80, 50, 10], inner: `<path d="${brimWeave}" stroke="#C9A55A" stroke-width="4" fill="none"/>` }) +
    cel(crown, '#EFCF86', { sw: 7, hl: [cx - 40, top + 22, 30, 16], inner: `<path d="${weave}" stroke="#CDA95E" stroke-width="3.5" fill="none"/>` }) +
    cel(`M${cx - 93} ${top + 64} Q${cx} ${top + 52} ${cx + 93} ${top + 64} L${cx + 92} ${top + 86} Q${cx} ${top + 74} ${cx - 92} ${top + 86}Z`, band, { sw: 5 })
  )
}

function sunglassesOnHead(cx, y, color = '#1F2A33') {
  const lens = (x) => `<path d="${smoothPath([[x - 30, y - 10], [x + 28, y - 12], [x + 30, y + 6], [x + 10, y + 18], [x - 22, y + 16], [x - 32, y + 2]])}" fill="${color}" stroke="${C.out}" stroke-width="5"/>
    <path d="M${x - 18} ${y - 4} l14 -3" stroke="#9FD3E8" stroke-width="5" stroke-linecap="round" opacity=".8"/>`
  return lens(cx - 40) + lens(cx + 40) + line(`M${cx - 10} ${y - 4} Q${cx} ${y - 10} ${cx + 10} ${y - 4}`, 5)
}

function witchHat(cx, top, color, band, tilt = -8) {
  const brim = ellipsePath(cx, top + 120, 150, 34)
  const cone = `M${cx - 92} ${top + 116} C${cx - 70} ${top + 40} ${cx - 30} ${top - 30} ${cx + 30} ${top - 110} C${cx + 34} ${top - 70} ${cx + 60} ${top + 30} ${cx + 92} ${top + 116}Z`
  return `<g transform="rotate(${tilt} ${cx} ${top + 110})">` +
    cel(brim, shade(color, 0.92), { sw: 7, hl: [cx - 60, top + 108, 50, 10] }) +
    cel(cone, color, { sw: 7, hl: [cx - 30, top + 30, 20, 40] }) +
    cel(`M${cx - 92} ${top + 92} Q${cx} ${top + 80} ${cx + 92} ${top + 92} L${cx + 94} ${top + 116} Q${cx} ${top + 104} ${cx - 94} ${top + 116}Z`, band, { sw: 5 }) +
    `<rect x="${cx - 16}" y="${top + 86}" width="32" height="26" rx="4" fill="#E2B33C" stroke="${C.out}" stroke-width="5"/><rect x="${cx - 7}" y="${top + 93}" width="14" height="12" fill="${band}"/>` +
    `</g>`
}

function wizardHat(cx, top) {
  const color = '#3B2A6E'
  const brim = ellipsePath(cx, top + 112, 150, 30)
  const cone = `M${cx - 88} ${top + 108} C${cx - 60} ${top + 20} ${cx - 10} ${top - 60} ${cx - 50} ${top - 120} C${cx + 30} ${top - 80} ${cx + 70} ${top + 20} ${cx + 88} ${top + 108}Z`
  const stars = [
    [cx - 30, top + 40, 14],
    [cx + 34, top + 66, 10],
    [cx + 10, top - 20, 9],
  ]
    .map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.45)}" fill="#F6C445" stroke="${C.out}" stroke-width="3"/>`)
    .join('')
  const moon = `<path d="M${cx + 40} ${top + 6} a16 16 0 1 0 6 26 a12 12 0 1 1 -6 -26Z" fill="#F6C445" stroke="${C.out}" stroke-width="3"/>`
  return cel(brim, shade(color, 0.9), { sw: 7, hl: [cx - 50, top + 102, 50, 9] }) + cel(cone, color, { sw: 7, hl: [cx - 30, top + 20, 18, 36], inner: stars + moon })
}

function catEars(cx, top) {
  const ear = (x, s) => {
    const d = `M${x - 34 * s} ${top + 40} L${x - 6 * s} ${top - 40} L${x + 30 * s} ${top + 30}Z`
    const inner = `M${x - 20 * s} ${top + 30} L${x - 6 * s} ${top - 16} L${x + 16 * s} ${top + 24}Z`
    return cel(d, '#2A2228', { sw: 6 }) + `<path d="${inner}" fill="#F2A0B6" stroke="${C.out}" stroke-width="3" stroke-linejoin="round"/>`
  }
  return line(`M${cx - 104} ${top + 70} Q${cx} ${top + 8} ${cx + 104} ${top + 70}`, 12, '#2A2228') + ear(cx - 58, 1) + ear(cx + 58, -1)
}

function bandana(cx, top) {
  const d = `M${cx - 108} ${top + 92} C${cx - 110} ${top + 10} ${cx - 50} ${top - 14} ${cx} ${top - 14} C${cx + 56} ${top - 14} ${cx + 110} ${top + 10} ${cx + 108} ${top + 92} Q${cx} ${top + 74} ${cx - 108} ${top + 92}Z`
  const dots = Array.from({ length: 14 }, (_, i) => {
    const x = cx - 84 + (i % 7) * 28 + (i > 6 ? 14 : 0)
    const y = top + 20 + Math.floor(i / 7) * 34
    return `<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`
  }).join('')
  const knot = `M${cx + 96} ${top + 70} l40 -14 l8 30 l-34 6 l26 34 l-26 10 l-20 -40Z`
  return cel(knot, '#B3261E', { sw: 6 }) + cel(d, '#C62828', { sw: 7, hl: [cx - 40, top + 14, 40, 14], inner: dots })
}

function eyePatch(cx, cy, gap = 40) {
  const x = cx - gap + 2
  return line(`M${cx - 104} ${cy - 40} L${cx + 110} ${cy - 66}`, 6, '#1B1B1B') +
    `<path d="${ellipsePath(x, cy + 4, 22, 20)}" fill="#1B1B1B" stroke="${C.out}" stroke-width="5"/>`
}

function dracCollar(cx) {
  const d = `M${cx - 150} 404 L${cx - 176} 170 L${cx - 90} 290 L${cx} 300 L${cx + 90} 290 L${cx + 176} 170 L${cx + 150} 404Z`
  const inner = `M${cx - 132} 390 L${cx - 152} 214 L${cx - 92} 300 L${cx + 92} 300 L${cx + 152} 214 L${cx + 132} 390Z`
  return cel(d, '#1E1A22', { sw: 8 }) + `<path d="${inner}" fill="#B71C1C" stroke="${C.out}" stroke-width="4" stroke-linejoin="round"/>`
}

function headphones(cx, y) {
  return line(`M${cx - 92} ${y - 10} Q${cx} ${y + 44} ${cx + 92} ${y - 10}`, 14, '#30363D') +
    cel(smoothPath([[cx - 120, y - 30], [cx - 82, y - 34], [cx - 74, y + 6], [cx - 112, y + 12]]), '#30363D', { sw: 6 }) +
    cel(smoothPath([[cx + 120, y - 30], [cx + 82, y - 34], [cx + 74, y + 6], [cx + 112, y + 12]]), '#30363D', { sw: 6 }) +
    `<ellipse cx="${cx - 96}" cy="${y - 12}" rx="12" ry="16" fill="${C.turq}"/><ellipse cx="${cx + 96}" cy="${y - 12}" rx="12" ry="16" fill="${C.turq}"/>`
}

function keysLanyard(cx) {
  return line(`M${cx - 70} 356 Q${cx - 30} 430 ${cx + 6} 452`, 9, '#C62828') + line(`M${cx + 74} 356 Q${cx + 40} 430 ${cx + 6} 452`, 9, '#C62828') +
    `<circle cx="${cx + 6}" cy="456" r="11" fill="none" stroke="#9AA5B1" stroke-width="5"/>` +
    cel(`M${cx - 6} 462 l-14 30 l10 4 l4 -8 l6 2 l2 -6 l-6 -3 l8 -16Z`, '#C9A227', { sw: 4 }) +
    cel(`M${cx + 12} 464 l4 34 l-3 8 l10 0 l-2 -8 l-1 -34Z`, '#AEB8C2', { sw: 4 }) +
    cel(rrectPathLocal(cx + 18, 458, 26, 34, 8), '#30363D', { sw: 4 })
}

function rrectPathLocal(x, y, w, h, r) {
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`
}

function fan(x, y) {
  const ribs = Array.from({ length: 7 }, (_, i) => {
    const a = (-150 + i * 20) * (Math.PI / 180)
    return `M${x} ${y} L${f(x + Math.cos(a) * 92)} ${f(y + Math.sin(a) * 92)}`
  }).join(' ')
  const d = `M${x} ${y} L${f(x + Math.cos((-160 * Math.PI) / 180) * 98)} ${f(y + Math.sin((-160 * Math.PI) / 180) * 98)} A98 98 0 0 1 ${f(x + Math.cos((-20 * Math.PI) / 180) * 98)} ${f(y + Math.sin((-20 * Math.PI) / 180) * 98)}Z`
  const hand = smoothPath([[x - 22, y - 6], [x + 16, y - 14], [x + 30, y + 10], [x + 22, y + 40], [x - 14, y + 42], [x - 30, y + 16]])
  return cel(d, '#C62828', {
    sw: 6,
    inner: `<path d="${ribs}" stroke="#7A1F1A" stroke-width="3"/><path d="M${x - 80} ${y - 30} A84 84 0 0 1 ${x + 80} ${y - 30}" stroke="#F6C445" stroke-width="6" fill="none"/>${[[-40, -60], [0, -74], [40, -60]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="8" fill="#F6C445"/>`).join('')}`,
  }) + cel(hand, '#E8B68E', { sw: 6 })
}

// ---------- Müşteriler ----------

const SKIN = { riza: '#EFC5A0', muhtar: '#E3AE86', taksici: '#D29A70', ogrenci: '#F2C9A3', esnaf: '#E8B68E' }

function baseFace({ cx, cy, rx, ry, jaw, skin, expr, eyeOpt = {}, browOpt = {}, mouthOpt = {}, mouthY = 70, noseSize = 1, cheekOpt = {}, earR = true }) {
  const head = headPath(cx, cy, rx, ry, jaw)
  const fcx = cx - FX
  let s = ''
  if (earR) s += ear(cx + rx * 0.98, cy + 14, skin, 1)
  s += cel(head, skin, { sw: 8, off: [12, 8], shadow: 0.86, hl: [cx - rx * 0.45, cy - ry * 0.45, rx * 0.35, ry * 0.22] })
  s += cheeks(expr, fcx, cy, cheekOpt)
  s += eyes(expr, fcx, cy + 4, eyeOpt)
  s += brows(expr, fcx, cy + 4, browOpt)
  s += nose(fcx, cy + 40, skin, noseSize)
  s += mouth(expr, fcx, cy + mouthY, mouthOpt)
  return { svg: s, head, fcx }
}

function compose(parts, outlinePaths) {
  return svg(W, W, `<g style="--skin:#000">${silhouette(outlinePaths, 18)}${parts}</g>`)
}

function riza(theme, expr) {
  const skin = SKIN.riza
  const cx = 256
  const cy = 226
  const rx = 98
  const ry = 110
  let back = ''
  let body = ''
  let front = ''
  const outlines = []
  const torso = torsoPath(352, theme === 'kis' ? 1.03 : 1)
  outlines.push(torso)

  if (theme === 'halloween') back += dracCollar(cx)

  // Gövde
  if (theme === 'kis') {
    body += cel(torso, '#2F4F6F', { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22, inner: `<path d="M256 360 L256 500" stroke="${shade('#2F4F6F', 0.7)}" stroke-width="6"/><path d="M90 440 Q256 470 420 440" stroke="${shade('#2F4F6F', 0.82)}" stroke-width="5" fill="none"/>` })
  } else if (theme === 'yaz') {
    body += cel(torso, '#BFD9EA', { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22, inner: `<path d="M256 360 L256 500" stroke="#8FB3CB" stroke-width="5"/><circle cx="256" cy="420" r="5" fill="#fff" stroke="${C.out}" stroke-width="2"/><circle cx="256" cy="460" r="5" fill="#fff" stroke="${C.out}" stroke-width="2"/>` })
    body += cel('M206 350 L256 410 L230 352Z', '#E3EEF5', { sw: 5 }) + cel('M306 350 L256 410 L282 352Z', '#E3EEF5', { sw: 5 })
  } else if (theme === 'halloween') {
    body += cel(torso, '#1E1A22', { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22 })
    body += cel('M206 356 L256 470 L306 356Z', '#F5F1E8', { sw: 5 })
    body += cel('M236 360 L256 386 L276 360 L266 352 L246 352Z', '#B71C1C', { sw: 4 })
    body += `<circle cx="256" cy="430" r="13" fill="#E2B33C" stroke="${C.out}" stroke-width="4"/><circle cx="256" cy="430" r="5" fill="#B71C1C"/>`
  } else {
    // Hırka + gömlek
    body += cel(torso, '#7D6B47', { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22, inner: Array.from({ length: 16 }, (_, i) => `<path d="M${84 + i * 24} 380 L${84 + i * 24} 500" stroke="${shade('#7D6B47', 0.88)}" stroke-width="4"/>`).join('') })
    body += cel('M210 354 L256 470 L302 354Z', '#DCE8F0', { sw: 5 })
    body += cel('M210 352 L256 404 L238 350Z', '#EEF4F8', { sw: 5 }) + cel('M302 352 L256 404 L274 350Z', '#EEF4F8', { sw: 5 })
    body += [418, 448, 478].map((y) => `<circle cx="${256 - (y - 400) * 0.25}" cy="${y}" r="7" fill="${C.brass}" stroke="${C.out}" stroke-width="3"/>`).join('')
  }

  const neck = neckPath(cy, 38, 300, 370)
  body += cel(neck, skin, { sw: 7, shadow: 0.8, off: [0, 14] })
  if (theme === 'kis') body += scarf('#B3261E', '#F5F1E8', 330) + snowOnShoulders()

  // Yüz
  const face = baseFace({
    cx, cy, rx, ry, jaw: 0.8, skin, expr,
    eyeOpt: { gap: 40, size: 0.95 },
    browOpt: { gap: 40, color: '#F2EEE6', bushy: true },
    mouthOpt: { w: 0.9, fangs: theme === 'halloween' },
    mouthY: 82,
    cheekOpt: { cold: theme === 'kis' },
  })
  outlines.push(face.head)
  front += face.svg
  const fcx = face.fcx
  // Kırışıklıklar
  front += line(`M${fcx - 30} ${cy - 62} q30 -8 60 0`, 4, shade(skin, 0.7)) + line(`M${fcx - 22} ${cy - 50} q22 -6 44 0`, 4, shade(skin, 0.7))
  if (expr !== 'happy') front += line(`M${fcx - 82} ${cy + 8} l-10 4 M${fcx + 86} ${cy + 8} l10 4`, 3.5, shade(skin, 0.7))
  // Beyaz favoriler
  front += cel(smoothPath([[cx - rx - 4, cy - 40], [cx - rx + 18, cy - 44], [cx - rx + 20, cy + 6], [cx - rx + 6, cy + 18]]), '#ECE8E0', { sw: 5 })
  front += cel(smoothPath([[cx + rx + 4, cy - 40], [cx + rx - 18, cy - 44], [cx + rx - 22, cy + 2], [cx + rx - 4, cy + 12]]), '#ECE8E0', { sw: 5 })
  // Gür beyaz bıyık
  const mY = cy + 68
  const mus = smoothPath([
    [fcx - 66, mY + 12],
    [fcx - 52, mY - 6],
    [fcx - 24, mY - 14],
    [fcx, mY - 8],
    [fcx + 26, mY - 14],
    [fcx + 54, mY - 6],
    [fcx + 70, mY + 12],
    [fcx + 50, mY + 18],
    [fcx + 26, mY + 10],
    [fcx, mY + 16],
    [fcx - 26, mY + 10],
    [fcx - 50, mY + 18],
  ])
  front += cel(mus, '#F4F1EA', { sw: 6, off: [0, 8], shadow: 0.85, inner: line(`M${fcx - 40} ${mY - 2} q10 8 20 0 M${fcx + 18} ${mY - 2} q10 8 20 0`, 3, '#CFC9BE') })
  // Burnun ucunda gözlük
  if (theme !== 'halloween') {
    const gy = cy + 40
    front += `<g fill="rgba(200,230,245,0.35)" stroke="#5A3E2B" stroke-width="5">
      <rect x="${fcx - 60}" y="${gy}" width="44" height="26" rx="8"/><rect x="${fcx + 18}" y="${gy}" width="44" height="26" rx="8"/></g>` +
      line(`M${fcx - 16} ${gy + 10} q17 -8 34 0`, 4, '#5A3E2B') +
      line(`M${fcx - 52} ${gy + 6} l8 6 M${fcx + 26} ${gy + 6} l8 6`, 3, '#fff', 'opacity=".8"')
  }
  if (expr === 'angry') front += angerMark(cx + 62, cy - 70)

  // Şapka
  if (theme === 'default') {
    const crown = `M${cx - 108} ${cy - 26} C${cx - 112} ${cy - 106} ${cx - 50} ${cy - 132} ${cx + 4} ${cy - 132} C${cx + 70} ${cy - 132} ${cx + 116} ${cy - 104} ${cx + 106} ${cy - 30} Q${cx} ${cy - 60} ${cx - 108} ${cy - 26}Z`
    const brim = `M${cx - 120} ${cy - 30} Q${cx - 30} ${cy - 66} ${cx + 70} ${cy - 46} Q${cx + 20} ${cy - 14} ${cx - 100} ${cy - 2} Q${cx - 128} ${cy - 10} ${cx - 120} ${cy - 30}Z`
    front += cel(crown, '#7A6A55', { sw: 7, hl: [cx - 30, cy - 110, 50, 16], inner: Array.from({ length: 10 }, (_, i) => `<path d="M${cx - 100 + i * 22} ${cy - 130} l10 100" stroke="#6A5B48" stroke-width="3"/>`).join('') })
    front += cel(brim, '#6B5C49', { sw: 7 })
    outlines.push(crown)
  } else if (theme === 'kis') {
    const crown = `M${cx - 108} ${cy - 20} C${cx - 112} ${cy - 106} ${cx - 50} ${cy - 132} ${cx + 4} ${cy - 132} C${cx + 70} ${cy - 132} ${cx + 116} ${cy - 104} ${cx + 106} ${cy - 24} Q${cx} ${cy - 56} ${cx - 108} ${cy - 20}Z`
    const flapL = `M${cx - 112} ${cy - 40} L${cx - 70} ${cy - 40} L${cx - 74} ${cy + 40} Q${cx - 96} ${cy + 56} ${cx - 118} ${cy + 36}Z`
    const flapR = `M${cx + 112} ${cy - 40} L${cx + 70} ${cy - 40} L${cx + 76} ${cy + 40} Q${cx + 98} ${cy + 56} ${cx + 120} ${cy + 36}Z`
    const brim = `M${cx - 104} ${cy - 30} Q${cx - 30} ${cy - 66} ${cx + 70} ${cy - 46} Q${cx + 20} ${cy - 16} ${cx - 92} ${cy - 6}Z`
    front += cel(flapL, '#5B4A3A', { sw: 6, inner: `<path d="M${cx - 116} ${cy + 30} q20 18 42 6" stroke="#EDE3D2" stroke-width="12" fill="none"/>` })
    front += cel(flapR, '#5B4A3A', { sw: 6, inner: `<path d="M${cx + 118} ${cy + 30} q-20 18 -42 6" stroke="#EDE3D2" stroke-width="12" fill="none"/>` })
    front += cel(crown, '#6B5843', { sw: 7, hl: [cx - 30, cy - 110, 50, 16] })
    front += cel(brim, '#5B4A3A', { sw: 7 })
    outlines.push(crown, flapL, flapR)
  } else if (theme === 'yaz') {
    front += strawHat(cx, cy - 150, C.tea)
  } else {
    // Geriye taranmış gri saç, sivri saç çizgisi
    const hair = `M${cx - 102} ${cy - 10} C${cx - 108} ${cy - 96} ${cx - 50} ${cy - 124} ${cx} ${cy - 124} C${cx + 60} ${cy - 124} ${cx + 110} ${cy - 96} ${cx + 102} ${cy - 10} L${cx + 84} ${cy - 50} Q${cx + 40} ${cy - 76} ${cx - 2} ${cy - 54} Q${cx - 44} ${cy - 76} ${cx - 86} ${cy - 50}Z`
    front += cel(hair, '#8D8A86', { sw: 7, hl: [cx - 30, cy - 100, 40, 12], inner: line(`M${cx - 60} ${cy - 100} q40 -10 90 6 M${cx - 70} ${cy - 80} q50 -10 110 8`, 4, '#6F6C68') })
    outlines.push(hair)
  }
  return compose(back + body + front, outlines)
}

function muhtar(theme, expr) {
  const skin = SKIN.muhtar
  const cx = 256
  const cy = 222
  const rx = 112
  const ry = 106
  let back = ''
  let body = ''
  let front = ''
  const outlines = []
  const torso = torsoPath(354, 1.04)
  outlines.push(torso)
  const navy = '#2C3E66'
  if (theme === 'yaz') {
    body += cel(torso, '#DDEBF5', { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22, inner: `<path d="M256 360 L256 500" stroke="#A9C3D8" stroke-width="5"/>` })
    body += cel('M204 352 L256 404 L228 350Z', '#F4F9FC', { sw: 5 }) + cel('M308 352 L256 404 L284 350Z', '#F4F9FC', { sw: 5 })
  } else {
    const coat = theme === 'kis' ? '#4A3A2E' : navy
    body += cel(torso, coat, { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22 })
    // Yelek
    body += cel('M196 360 L256 500 L316 360 Q256 372 196 360Z', '#7A1F2B', { sw: 6, inner: [420, 452, 484].map((y) => `<circle cx="256" cy="${y}" r="5.5" fill="${C.brass}" stroke="${C.out}" stroke-width="2.5"/>`).join('') })
    body += cel('M218 356 L256 420 L294 356Z', '#F7F7F2', { sw: 5 })
    body += cel('M244 362 L268 362 L272 380 L256 456 L240 380Z', C.tea, { sw: 5 })
    // Yakalar
    body += cel('M190 356 L246 456 L210 380 L176 372Z', shade(coat, 1.12), { sw: 6 }) + cel('M322 356 L266 456 L302 380 L336 372Z', shade(coat, 1.12), { sw: 6 })
    if (theme === 'kis') body += scarf(C.cobalt, '#F5F1E8', 334) + snowOnShoulders()
  }
  const neck = neckPath(cy, 44, 296, 368)
  body += cel(neck, skin, { sw: 7, shadow: 0.8, off: [0, 14] })

  const face = baseFace({
    cx, cy, rx, ry, jaw: 0.9, skin, expr,
    eyeOpt: { gap: 42, size: 0.92, lids: expr === 'neutral' },
    browOpt: { gap: 42, color: '#1E1A18', w: 12 },
    mouthY: 82,
    cheekOpt: { cold: theme === 'kis' },
  })
  outlines.push(face.head)
  front += face.svg
  const fcx = face.fcx
  // Kalın siyah bıyık
  const mY = cy + 66
  const mus = smoothPath([
    [fcx - 60, mY + 14],
    [fcx - 46, mY - 6],
    [fcx - 14, mY - 10],
    [fcx + 16, mY - 10],
    [fcx + 48, mY - 6],
    [fcx + 64, mY + 14],
    [fcx + 30, mY + 10],
    [fcx, mY + 6],
    [fcx - 30, mY + 10],
  ])
  front += cel(mus, '#221C19', { sw: 5, off: [0, 6], shadow: 0.7, hl: [fcx - 20, mY - 4, 18, 4], hlOpacity: 0.25 })
  // Dökük saç: yanlarda koyu saç, tepede seyrek tel
  if (theme === 'default' || theme === 'yaz') {
    const band = (sgn) =>
      line(`M${cx + sgn * (rx - 22)} ${cy - 74} Q${cx + sgn * (rx + 2)} ${cy - 50} ${cx + sgn * (rx - 2)} ${cy + 6}`, 30, C.out) +
      line(`M${cx + sgn * (rx - 22)} ${cy - 74} Q${cx + sgn * (rx + 2)} ${cy - 50} ${cx + sgn * (rx - 2)} ${cy + 6}`, 20, '#2B2420')
    front += band(-1) + band(1)
    front += line(`M${cx - 50} ${cy - 92} Q${cx} ${cy - 112} ${cx + 52} ${cy - 90}`, 5, '#2B2420') + line(`M${cx - 40} ${cy - 80} Q${cx + 4} ${cy - 98} ${cx + 44} ${cy - 80}`, 4, '#2B2420')
    // Kafada parlama
    front += `<ellipse cx="${cx - 30}" cy="${cy - 84}" rx="26" ry="10" fill="#fff" opacity=".45" filter="url(#b4)"/>`
  }
  if (expr === 'angry') front += angerMark(cx + 70, cy - 64) + sweat(cx - 104, cy - 40)
  if (theme === 'yaz') front += sunglassesOnHead(cx - 6, cy - 82)
  if (theme === 'kis') front += beanie(cx, cy - 128, '#4D5560', '#3C434C', null, 116)
  if (theme === 'halloween') front += wizardHat(cx, cy - 150)
  return compose(back + body + front, outlines)
}

function taksici(theme, expr) {
  const skin = SKIN.taksici
  const cx = 256
  const cy = 224
  const rx = 100
  const ry = 112
  let body = ''
  let front = ''
  const outlines = []
  const torso = torsoPath(352)
  outlines.push(torso)
  const yellow = '#F2C230'
  if (theme === 'yaz') {
    body += cel(torso, yellow, { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22 })
    body += cel('M206 350 L256 392 L232 350Z', '#2E3238', { sw: 5 }) + cel('M306 350 L256 392 L280 350Z', '#2E3238', { sw: 5 })
    body += [400, 426].map((y) => `<circle cx="256" cy="${y}" r="5" fill="#fff" stroke="${C.out}" stroke-width="2"/>`).join('')
  } else {
    const jacket = theme === 'kis' ? '#22262C' : '#2E3238'
    body += cel(torso, jacket, {
      sw: 8,
      hl: [160, 392, 46, 12], hlOpacity: 0.22,
      inner: `<path d="M90 430 Q140 390 196 372" stroke="${yellow}" stroke-width="12" fill="none"/><path d="M422 430 Q372 390 316 372" stroke="${yellow}" stroke-width="12" fill="none"/>
        <path d="M256 360 L256 500" stroke="${yellow}" stroke-width="7"/>${theme === 'kis' ? '<path d="M80 450 Q256 480 432 450 M90 410 Q256 440 422 410" stroke="#383E46" stroke-width="6" fill="none"/>' : ''}`,
    })
    body += cel('M204 350 L240 352 L232 384 Z', shade(jacket, 1.2), { sw: 5 }) + cel('M308 350 L272 352 L280 384 Z', shade(jacket, 1.2), { sw: 5 })
  }
  const neck = neckPath(cy, 40, 300, 368)
  body += cel(neck, skin, { sw: 7, shadow: 0.8, off: [0, 14] })
  if (theme !== 'kis') body += keysLanyard(cx)
  if (theme === 'kis') body += scarf('#2E3238', null, 332) + snowOnShoulders()

  const face = baseFace({
    cx, cy, rx, ry, jaw: 0.84, skin, expr,
    eyeOpt: { gap: 40, size: 0.92, patch: theme === 'halloween' },
    browOpt: { gap: 40, color: '#2A221E', w: 10 },
    mouthY: 78,
    cheekOpt: { cold: theme === 'kis' },
  })
  outlines.push(face.head)
  front += face.svg
  // Kirli sakal: çenede noktalı gölge
  const tid = newId('st')
  front += `<clipPath id="${tid}"><path d="${face.head}"/></clipPath><g clip-path="url(#${tid})" opacity=".35">${Array.from({ length: 130 }, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180
    const r = Math.sqrt(i / 130)
    const x = cx - FX + Math.cos(a) * 90 * r
    const y = cy + 70 + Math.abs(Math.sin(a)) * 46 * r
    return `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#3B2A22"/>`
  }).join('')}</g>`
  // Kısa saç
  if (theme === 'default' || theme === 'yaz') {
    const hair = `M${cx - 104} ${cy - 24} C${cx - 110} ${cy - 100} ${cx - 50} ${cy - 124} ${cx + 4} ${cy - 124} C${cx + 64} ${cy - 124} ${cx + 112} ${cy - 96} ${cx + 104} ${cy - 24} L${cx + 92} ${cy - 46} Q${cx + 50} ${cy - 66} ${cx + 10} ${cy - 62} L${cx - 10} ${cy - 76} L${cx - 26} ${cy - 60} Q${cx - 70} ${cy - 62} ${cx - 92} ${cy - 44}Z`
    front += cel(hair, '#2A221E', { sw: 7, hl: [cx - 30, cy - 104, 40, 10], hlOpacity: 0.25 })
    outlines.push(hair)
  }
  if (expr === 'angry') front += angerMark(cx + 64, cy - 60)
  if (theme === 'yaz') front += sunglassesOnHead(cx - 6, cy - 86)
  if (theme === 'kis') front += beanie(cx, cy - 128, '#8B1E0F', '#F5F1E8', null, 108)
  if (theme === 'halloween') {
    front += eyePatch(cx - FX, cy + 4)
    front += bandana(cx, cy - 116)
  }
  return compose(body + front, outlines)
}

function ogrenci(theme, expr) {
  const skin = SKIN.ogrenci
  const cx = 256
  const cy = 222
  const rx = 92
  const ry = 104
  let back = ''
  let body = ''
  let front = ''
  const outlines = []
  const torso = torsoPath(356, 0.96)
  outlines.push(torso)
  const hairC = '#4A2C1D'
  // Kıvırcık at kuyruğu (arkada)
  const curls = (x, y, n, r) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      return [x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1]
    })
  if (theme !== 'kis') {
    const pony = smoothPath([...curls(cx + 112, cy - 40, 9, 44)].map(([x, y], i) => [x + (i % 2 ? 8 : -6), y + (i % 2 ? 6 : -4)]))
    back += cel(pony, hairC, { sw: 7, hl: [cx + 100, cy - 66, 16, 8], hlOpacity: 0.25 })
    outlines.push(pony)
  }
  // Gövde
  if (theme === 'yaz') {
    body += cel(torso, '#FBFBF6', { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22, inner: `<path d="M70 432 Q256 462 442 432" stroke="${C.turq}" stroke-width="16" fill="none"/>` })
    body += cel(`M214 356 Q256 384 298 356 L292 368 Q256 396 220 368Z`, C.turq, { sw: 5 })
  } else if (theme === 'kis') {
    body += cel(torso, '#E07A5F', { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22, inner: `<path d="M80 420 Q256 450 432 420 M86 460 Q256 490 426 460" stroke="${shade('#E07A5F', 0.85)}" stroke-width="6" fill="none"/><path d="M256 360 L256 500" stroke="${shade('#E07A5F', 0.7)}" stroke-width="6"/>` })
  } else {
    // Turkuaz kapüşonlu
    const hood = `M150 380 C140 336 190 318 256 320 C322 318 372 336 362 380 Q256 410 150 380Z`
    body += cel(torso, C.turq, { sw: 8, hl: [160, 392, 46, 12], hlOpacity: 0.22 })
    body += cel(hood, shade(C.turq, 0.9), { sw: 6 })
    body += line('M232 376 L226 450', 5, '#F5F1E8') + line('M280 376 L286 450', 5, '#F5F1E8')
    body += `<circle cx="226" cy="454" r="6" fill="#F5F1E8" stroke="${C.out}" stroke-width="3"/><circle cx="286" cy="454" r="6" fill="#F5F1E8" stroke="${C.out}" stroke-width="3"/>`
    if (theme === 'halloween') body += `<path d="M300 440 l14 -8 l14 8 l-6 14 l-16 0Z" fill="#F07C1E" stroke="${C.out}" stroke-width="3"/>`
  }
  const neck = neckPath(cy, 32, 296, 368)
  body += cel(neck, skin, { sw: 7, shadow: 0.8, off: [0, 14] })
  if (theme !== 'kis') body += headphones(cx, 352)
  if (theme === 'kis') body += scarf('#E2B33C', '#8B1E0F', 328) + snowOnShoulders()

  // Saç arka kütlesi
  const hairBack = smoothPath([
    [cx - 104, cy + 30],
    [cx - 116, cy - 40],
    [cx - 80, cy - 112],
    [cx, cy - 128],
    [cx + 84, cy - 110],
    [cx + 116, cy - 40],
    [cx + 104, cy + 30],
  ])
  front += cel(hairBack, hairC, { sw: 7 })
  outlines.push(hairBack)
  const face = baseFace({
    cx, cy, rx, ry, jaw: 0.78, skin, expr,
    eyeOpt: { gap: 36, size: 0.98 },
    browOpt: { gap: 36, color: hairC, w: 7 },
    mouthOpt: { w: 0.8 },
    mouthY: 72,
    noseSize: 0.8,
    cheekOpt: { always: true, cold: theme === 'kis' },
  })
  front += face.svg
  const fcx = face.fcx
  // Yuvarlak gözlük
  front += `<g fill="rgba(210,235,250,0.3)" stroke="#3B2416" stroke-width="6"><circle cx="${fcx - 34}" cy="${cy + 8}" r="30"/><circle cx="${fcx + 38}" cy="${cy + 8}" r="30"/></g>` +
    line(`M${fcx - 4} ${cy + 4} q6 -6 12 0`, 5) + line(`M${fcx - 64} ${cy + 2} L${cx - rx} ${cy - 4} M${fcx + 68} ${cy + 2} L${cx + rx} ${cy - 6}`, 5) +
    line(`M${fcx - 48} ${cy - 6} l12 -6 M${fcx + 24} ${cy - 6} l12 -6`, 4, '#fff', 'opacity=".8"')
  // Kıvırcık perçemler
  const fringe = smoothPath([
    [cx - 100, cy - 10],
    [cx - 94, cy - 70],
    [cx - 50, cy - 104],
    [cx + 10, cy - 112],
    [cx + 70, cy - 98],
    [cx + 104, cy - 50],
    [cx + 100, cy - 4],
    [cx + 80, cy - 40],
    [cx + 60, cy - 54],
    [cx + 40, cy - 46],
    [cx + 16, cy - 64],
    [cx - 8, cy - 50],
    [cx - 30, cy - 66],
    [cx - 56, cy - 50],
    [cx - 78, cy - 50],
  ])
  if (theme !== 'kis') {
    front += cel(fringe, hairC, { sw: 7, hl: [cx - 30, cy - 96, 36, 10], hlOpacity: 0.3, inner: line(`M${cx - 60} ${cy - 80} q10 10 0 20 M${cx + 30} ${cy - 92} q10 10 0 20 M${cx + 76} ${cy - 70} q8 10 -2 18`, 4, shade(hairC, 0.7)) })
    // Kulak önü bukleler
    front += cel(smoothPath([[cx - 98, cy - 20], [cx - 84, cy + 10], [cx - 100, cy + 44], [cx - 112, cy + 10]]), hairC, { sw: 6 })
  }
  if (expr === 'angry') front += angerMark(cx + 60, cy - 54)
  if (theme === 'yaz') front += strawHat(cx, cy - 146, C.turq, 160)
  if (theme === 'kis') front += beanie(cx, cy - 128, '#F5F1E8', C.turq, C.turq, 104)
  if (theme === 'halloween') front += witchHat(cx + 6, cy - 176, '#2B2238', '#F07C1E', -10)
  return compose(back + body + front, outlines)
}

function esnaf(theme, expr) {
  const skin = SKIN.esnaf
  const cx = 256
  const cy = 226
  const rx = 98
  const ry = 108
  let back = ''
  let body = ''
  let front = ''
  const outlines = []
  const hairC = '#5A2E1E'
  // Sıvanmış kollar: çıplak üst kol + kıvrık kol ağzı
  const armL = `M78 490 C70 446 80 408 110 390 C128 382 146 386 152 398 C148 432 144 462 142 494Z`
  const armR = `M434 490 C442 446 432 408 402 390 C384 382 366 386 360 398 C364 432 368 462 370 494Z`
  body += cel(armL, skin, { sw: 7 }) + cel(armR, skin, { sw: 7 })
  outlines.push(armL, armR)
  const torso = `M112 488 C108 430 124 396 168 378 C196 366 206 360 218 356 L294 356 C306 360 316 366 344 378 C388 396 404 430 400 488 Q256 508 112 488Z`
  outlines.push(torso)
  // Topuz (arkada)
  if (theme !== 'kis') {
    const bun = ellipsePath(cx + 8, cy - 132, 52, 42)
    back += cel(bun, hairC, { sw: 7, hl: [cx - 8, cy - 150, 18, 8], hlOpacity: 0.25, inner: line(`M${cx - 30} ${cy - 130} q38 -30 76 0 M${cx - 20} ${cy - 112} q30 -22 60 2`, 4, shade(hairC, 0.7)) })
    outlines.push(bun)
  }
  if (theme === 'kis') {
    body += cel(torso, '#7A8F5A', { sw: 8, hl: [186, 392, 40, 12], hlOpacity: 0.22, inner: Array.from({ length: 12 }, (_, i) => `<path d="M${126 + i * 24} 380 L${126 + i * 24} 500" stroke="${shade('#7A8F5A', 0.86)}" stroke-width="4"/>`).join('') })
  } else {
    const blouse = theme === 'yaz' ? '#F6C445' : '#D99A2B'
    body += cel(torso, blouse, { sw: 8, hl: [186, 392, 40, 12], hlOpacity: 0.22 })
    // Kıvrık kol ağızları
    body += cel('M100 388 C118 376 146 378 156 390 L154 414 C140 402 116 402 96 412Z', shade(blouse, 1.12), { sw: 6 }) +
      cel('M412 388 C394 376 366 378 356 390 L358 414 C372 402 396 402 416 412Z', shade(blouse, 1.12), { sw: 6 })
    // Çizgili önlük
    const apron = `M178 400 Q256 388 334 400 L346 500 Q256 512 166 500Z`
    const stripes = Array.from({ length: 10 }, (_, i) => `<rect x="${170 + i * 18}" y="380" width="9" height="140" fill="${C.cobalt}"/>`).join('')
    body += cel(apron, '#F5F1E8', { sw: 6, inner: stripes })
    body += line('M186 402 L214 356', 10, C.cobalt) + line('M326 402 L298 356', 10, C.cobalt)
  }
  const neck = neckPath(cy, 34, 300, 368)
  body += cel(neck, skin, { sw: 7, shadow: 0.8, off: [0, 14] })
  if (theme === 'kis') body += scarf(C.turq, '#F5F1E8', 330) + snowOnShoulders()

  // Saç kütlesi
  const hair = smoothPath([
    [cx - 100, cy + 10],
    [cx - 108, cy - 60],
    [cx - 60, cy - 116],
    [cx + 10, cy - 124],
    [cx + 80, cy - 108],
    [cx + 110, cy - 56],
    [cx + 100, cy + 10],
  ])
  front += cel(hair, hairC, { sw: 7 })
  outlines.push(hair)
  const face = baseFace({
    cx, cy, rx, ry, jaw: 0.8, skin, expr,
    eyeOpt: { gap: 38, size: 0.98 },
    browOpt: { gap: 38, color: hairC, w: 8 },
    mouthOpt: { w: 0.85 },
    mouthY: 74,
    noseSize: 0.85,
    cheekOpt: { cold: theme === 'kis' },
  })
  front += face.svg
  // Kirpik
  if (expr === 'neutral') front += line(`M${face.fcx - 58} ${cy - 2} l-8 -6 M${face.fcx + 58} ${cy - 2} l8 -6`, 4)
  // Ruj
  front += `<ellipse cx="${face.fcx}" cy="${cy + 82}" rx="10" ry="4" fill="#B3261E" opacity="${expr === 'neutral' ? 0.5 : 0}"/>`
  // Ön saç: ortadan ayrık, topuza toplanmış
  if (theme !== 'kis') {
    front += cel(`M${cx - 98} ${cy - 10} C${cx - 104} ${cy - 80} ${cx - 50} ${cy - 112} ${cx + 4} ${cy - 108} L${cx - 6} ${cy - 70} Q${cx - 60} ${cy - 64} ${cx - 98} ${cy - 10}Z`, hairC, { sw: 6, hl: [cx - 50, cy - 90, 22, 8], hlOpacity: 0.25 })
    front += cel(`M${cx + 98} ${cy - 10} C${cx + 106} ${cy - 80} ${cx + 56} ${cy - 112} ${cx + 4} ${cy - 108} L${cx + 12} ${cy - 70} Q${cx + 66} ${cy - 64} ${cx + 98} ${cy - 10}Z`, hairC, { sw: 6 })
  }
  // Küpe
  front += `<circle cx="${cx + rx + 6}" cy="${cy + 40}" r="7" fill="${C.gold}" stroke="${C.out}" stroke-width="3"/>`
  // Kulağın arkasında kurşun kalem
  if (theme !== 'kis') {
    front += `<g transform="rotate(-62 ${cx + 104} ${cy - 10})">` +
      cel(`M${cx + 40} ${cy - 18} L${cx + 160} ${cy - 18} L${cx + 160} ${cy - 2} L${cx + 40} ${cy - 2}Z`, '#F2C230', { sw: 5 }) +
      `<path d="M${cx + 160} ${cy - 18} L${cx + 184} ${cy - 10} L${cx + 160} ${cy - 2}Z" fill="#F3D3A8" stroke="${C.out}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M${cx + 176} ${cy - 13} L${cx + 184} ${cy - 10} L${cx + 176} ${cy - 7}Z" fill="#3B2416"/>` +
      `<rect x="${cx + 26}" y="${cy - 18}" width="16" height="16" rx="3" fill="#E87A8A" stroke="${C.out}" stroke-width="5"/></g>`
  }
  if (expr === 'angry') front += angerMark(cx + 62, cy - 62)
  if (theme === 'yaz') front += sunglassesOnHead(cx, cy - 90) + fan(150, 470)
  if (theme === 'kis') front += beanie(cx, cy - 130, C.turq, '#F5F1E8', '#F5F1E8', 108)
  if (theme === 'halloween') front += catEars(cx, cy - 130)
  return compose(back + body + front, outlines)
}

const BUILDERS = { riza, muhtar, taksici, ogrenci, esnaf }

register(
  (id) => id.startsWith('char_'),
  (a, ctx) => {
    const [, who, expr] = a.id.split('_')
    const fn = BUILDERS[who]
    if (!fn) return null
    // CSS değişkeni yerine ten rengini doğrudan göm (açılı göz kapağı için).
    return fn(ctx.theme, expr).replaceAll('var(--skin)', SKIN[who])
  },
)

export { mix }
